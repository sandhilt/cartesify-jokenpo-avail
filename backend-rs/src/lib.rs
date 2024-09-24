mod utils;

use chrono::prelude::*;
use sha3::{Digest, Sha3_256};
use std::{collections::HashMap, fmt::Display};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
struct Manager {
    next_id: u32,
    challenges: HashMap<u32, Challenge>,
    player_challenges: HashMap<String, u32>,
}

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone)]
pub enum MoveType {
    None,
    Rock,
    Paper,
    Scissors,
}

impl From<String> for MoveType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "1" => MoveType::Rock,
            "2" => MoveType::Paper,
            "3" => MoveType::Scissors,
            _ => MoveType::None,
        }
    }
}

impl From<MoveType> for u32 {
    fn from(val: MoveType) -> Self {
        match val {
            MoveType::Rock => 1,
            MoveType::Paper => 2,
            MoveType::Scissors => 3,
            MoveType::None => 0,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
struct Move {
    commitment: String,
    move_type: MoveType,
}

#[wasm_bindgen]
impl Move {
    #[wasm_bindgen(constructor)]
    pub fn new(commitment: String) -> Self {
        Move {
            commitment,
            move_type: MoveType::None,
        }
    }

    #[wasm_bindgen(getter, js_name = move)]
    pub fn movement(&self) -> u32 {
        self.move_type.clone().into()
    }
}

#[wasm_bindgen]
struct Mapper {
    map: HashMap<String, Move>,
}

impl From<HashMap<String, Move>> for Mapper {
    fn from(map: HashMap<String, Move>) -> Self {
        Mapper { map }
    }
}

#[wasm_bindgen]
impl Mapper {
    pub fn get(&self, key: &str) -> Option<Move> {
        self.map.get(key).cloned()
    }
}

#[wasm_bindgen]
struct Challenge {
    creator_address: String,
    opponent_address: Option<String>,
    id: u32,
    // ISO 8601
    created_at: String,
    winner_address: Option<String>,
    commitments: HashMap<String, Move>,
}

impl Display for Challenge {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let commitments: Vec<String> = self
            .commitments
            .iter()
            .map(|(k, v)| format!("{}: {}", k, v.commitment))
            .collect();

        write!(
            f,
            r#"Challenge {{
                creator_address: {},
                opponent_address: {:?},
                id: {},
                created_at: {},
                winner_address: {:?},
                commitments: {:?}
            }}"#,
            self.creator_address,
            self.opponent_address,
            self.id,
            self.created_at,
            self.winner_address,
            commitments
        )
    }
}

#[wasm_bindgen]
impl Challenge {
    #[wasm_bindgen(constructor)]
    pub fn new(id: u32, creator_address: String, commitment: String) -> Self {
        let mut commitments = HashMap::new();
        let movement = Move::new(commitment);

        commitments.insert(creator_address.clone(), movement);

        let element = Challenge {
            creator_address,
            id,
            commitments,
            created_at: Utc::now().to_rfc3339(),
            opponent_address: None,
            winner_address: None,
        };

        log(&format!("Creating challenge: {}", element));

        element
    }

    #[wasm_bindgen(getter, js_name = opponentAddress)]
    pub fn opponent_address(&self) -> Option<String> {
        self.opponent_address.clone()
    }

    #[wasm_bindgen(getter, js_name = creatorAddress)]
    pub fn creator_address(&self) -> String {
        self.creator_address.clone()
    }

    #[wasm_bindgen(getter, js_name = winnerAddress)]
    pub fn winner_address(&self) -> Option<String> {
        self.winner_address.clone()
    }

    #[wasm_bindgen(getter, js_name = commitments)]
    pub fn commitments(&self) -> Mapper {
        Mapper::from(self.commitments.clone())
    }

    #[wasm_bindgen(js_name = addOpponent)]
    pub fn add_opponent(&mut self, opponent_address: String, commitment: String) {
        log(&format!("Adding opponent: {}", opponent_address));
        let movement = Move::new(commitment);
        self.opponent_address = Some(opponent_address.clone());
        self.commitments.insert(opponent_address, movement);
    }

    #[wasm_bindgen(js_name = bothRevealed)]
    pub fn both_revealed(&self) -> bool {
        let oponent_address = self
            .opponent_address
            .as_ref()
            .and_then(|oa| self.commitments.get(oa));

        let oponent_move = match oponent_address {
            Some(movement) => movement,
            None => return false,
        };

        let creator_move = match self.commitments.get(&self.creator_address) {
            Some(movement) => movement,
            None => return false,
        };

        creator_move.move_type != MoveType::None && oponent_move.move_type != MoveType::None
    }

    #[wasm_bindgen]
    pub fn reveal(
        &mut self,
        address: String,
        move_type: String,
        nonce: String,
    ) -> Result<(), String> {
        if !self
            .opponent_address
            .as_ref()
            .map_or(false, |oa| self.commitments.contains_key(oa))
        {
            return Err("Opponent has not commited yet".to_string());
        }

        let seed = format!("{}{}", move_type, nonce);
        let reveal_hash = Challenge::generate_hash(seed);

        self.commitments
            .get_mut(&address)
            .and_then(|m| {
                if m.commitment == reveal_hash {
                    m.move_type = move_type.into();
                    Some(())
                } else {
                    None
                }
            })
            .ok_or("Move does not match the commitment".into())
    }

    #[wasm_bindgen(js_name = generateHash)]
    pub fn generate_hash(hash: String) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(hash);
        let result = hasher.finalize();
        format!("{:x}", result)
    }

    #[wasm_bindgen(js_name = evaluateWinner)]
    pub fn evalue_winner(&self) -> Option<String> {
        let oponnent_move = self
            .opponent_address
            .as_ref()
            .and_then(|oa| self.commitments.get(oa))?;

        let creator_move = self.commitments.get(&self.creator_address)?;

        if creator_move.move_type == MoveType::None {
            log("Creator has not revealed yet");
            return None;
        }

        if oponnent_move.move_type == MoveType::None {
            log("Opponent has not revealed yet");
            return None;
        }

        if creator_move.move_type == oponnent_move.move_type {
            log("It's a tie");
            return None;
        }

        if creator_move.move_type == MoveType::Rock {
            return match oponnent_move.move_type {
                MoveType::Scissors => Some(self.creator_address.clone()),
                _ => Some(self.opponent_address.as_ref().unwrap().clone()),
            };
        }

        if creator_move.move_type == MoveType::Paper {
            return match oponnent_move.move_type {
                MoveType::Rock => Some(self.creator_address.clone()),
                _ => Some(self.opponent_address.as_ref().unwrap().clone()),
            };
        }

        if creator_move.move_type == MoveType::Scissors {
            return match oponnent_move.move_type {
                MoveType::Paper => Some(self.creator_address.clone()),
                _ => Some(self.opponent_address.as_ref().unwrap().clone()),
            };
        }

        None
    }
}

#[wasm_bindgen]
pub fn greet() {
    log("Hello, gm!");
}
