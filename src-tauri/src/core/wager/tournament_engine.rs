use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use crate::core::wager::{
    errors::WagerError,
    types::{Tournament, TournamentStatus, TournamentMatch, PLATFORM_FEE_PCT, MIN_REFEREES},
};
use crate::core::database::connection::Database;
use crate::core::database::queries;
use crate::core::payment::types::Wallet;

pub fn create_tournament(
    host_id: &str,
    name: &str,
    game_type: &str,
    entry_fee: f64,
    max_participants: u32,
    starts_at: i64,
    referee_ids: Vec<String>,
) -> Result<Tournament, WagerError> {
    if name.is_empty() { return Err(WagerError::InvalidGameType("Tournament name cannot be empty".to_string())); }
    if max_participants < 2 { return Err(WagerError::InvalidGameType("Tournament requires at least 2 participants".to_string())); }
    if starts_at <= now_secs() { return Err(WagerError::InvalidGameType("Tournament start time must be in the future".to_string())); }

    let now = now_secs();
    let prize_pool = calculate_prize_pool(entry_fee, max_participants);

    Ok(Tournament {
        id: Uuid::new_v4().to_string(),
        host_id: host_id.to_string(),
        name: name.to_string(),
        game_type: game_type.to_string(),
        entry_fee,
        prize_pool,
        max_participants,
        participants: Vec::new(),
        bracket: Vec::new(),
        status: TournamentStatus::Registration,
        created_at: now,
        starts_at,
        referee_ids,
        host_fee_pct: PLATFORM_FEE_PCT,
    })
}

pub fn join_tournament(
    tournament: &mut Tournament,
    participant_id: &str,
) -> Result<(), WagerError> {
    if tournament.status != TournamentStatus::Registration {
        return Err(WagerError::InvalidGameType("Tournament is not accepting participants".to_string()));
    }
    if tournament.participants.len() >= tournament.max_participants as usize {
        return Err(WagerError::TournamentFull);
    }
    if tournament.participants.contains(&participant_id.to_string()) {
        return Err(WagerError::AlreadyRegistered);
    }

    tournament.participants.push(participant_id.to_string());
    Ok(())
}

pub fn start_tournament(tournament: &mut Tournament) -> Result<(), WagerError> {
    if tournament.status != TournamentStatus::Registration {
        return Err(WagerError::InvalidGameType("Tournament is not in registration status".to_string()));
    }
    if tournament.participants.len() < 2 {
        return Err(WagerError::InvalidGameType("Tournament requires at least 2 participants to start".to_string()));
    }

    tournament.bracket = build_single_elimination_bracket(&tournament.participants);
    tournament.status = TournamentStatus::InProgress;
    Ok(())
}

pub fn report_match_result(
    tournament: &mut Tournament,
    match_id: &str,
    winner_id: &str,
) -> Result<Option<String>, WagerError> {
    if tournament.status != TournamentStatus::InProgress {
        return Err(WagerError::InvalidGameType("Tournament is not in progress".to_string()));
    }

    let match_idx = tournament.bracket.iter().position(|m| m.id == match_id)
        .ok_or_else(|| WagerError::NotFound(format!("Match '{}' not found", match_id)))?;

    let game_match = &tournament.bracket[match_idx];
    if game_match.completed {
        return Err(WagerError::InvalidStatus("Match already completed".to_string()));
    }

    let is_valid = game_match.player1_id.as_deref() == Some(winner_id)
        || game_match.player2_id.as_deref() == Some(winner_id);
    if !is_valid {
        return Err(WagerError::NotFound(format!("{} is not in match {}", winner_id, match_id)));
    }

    tournament.bracket[match_idx].winner_id = Some(winner_id.to_string());
    tournament.bracket[match_idx].completed = true;

    advance_winner(tournament, match_idx, winner_id);

    let all_done = tournament.bracket.iter().all(|m| m.completed);
    if all_done {
        tournament.status = TournamentStatus::Completed;
    }

    Ok(tournament.bracket.iter()
        .find(|m| !m.completed)
        .map(|m| m.id.clone()))
}

pub fn end_tournament(tournament: &mut Tournament) -> Result<(), WagerError> {
    if tournament.status != TournamentStatus::InProgress {
        return Err(WagerError::InvalidGameType("Tournament is not in progress".to_string()));
    }

    tournament.status = TournamentStatus::Completed;
    Ok(())
}

pub fn get_tournament_winner(tournament: &Tournament) -> Option<String> {
    if tournament.status != TournamentStatus::Completed {
        return None;
    }

    let final_round = tournament.bracket.iter().map(|m| m.round).max()?;
    tournament.bracket.iter()
        .filter(|m| m.round == final_round && m.completed)
        .filter_map(|m| m.winner_id.clone())
        .next()
}

pub fn calculate_prize_distribution(tournament: &Tournament) -> Vec<(String, f64)> {
    if tournament.status != TournamentStatus::Completed {
        return Vec::new();
    }

    let host_fee = tournament.prize_pool * tournament.host_fee_pct;
    let distributable = tournament.prize_pool - host_fee;

    let final_round = tournament.bracket.iter().map(|m| m.round).max().unwrap_or(1);
    let mut placements: Vec<(String, f64)> = Vec::new();

    for round in (1..=final_round).rev() {
        let round_matches: Vec<&TournamentMatch> = tournament.bracket.iter()
            .filter(|m| m.round == round && m.completed)
            .collect();

        let rank = final_round - round;
        let share = match rank {
            0 => distributable * 0.5,
            1 => distributable * 0.3,
            2 => distributable * 0.15,
            _ => distributable * 0.05,
        };

        for m in round_matches {
            if let Some(ref winner) = m.winner_id {
                if !placements.iter().any(|(id, _)| id == winner) {
                    placements.push((winner.clone(), share));
                }
            }
        }
    }

    placements
}

fn build_single_elimination_bracket(participants: &[String]) -> Vec<TournamentMatch> {
    let n = participants.len();
    let next_power_of_2 = n.next_power_of_two();
    let mut seeds: Vec<Option<String>> = participants.iter().map(|p| Some(p.clone())).collect();
    seeds.resize(next_power_of_2, None);

    let num_rounds = (next_power_of_2 as f64).log2() as u32;
    let mut bracket: Vec<TournamentMatch> = Vec::new();
    let mut match_counter = 0u32;

    for round in 0..num_rounds {
        let matches_in_round = next_power_of_2 >> (round + 1);
        for i in 0..matches_in_round {
            match_counter += 1;
            let p1 = seeds[i * 2].clone();
            let p2 = seeds[i * 2 + 1].clone();

            let (winner, completed) = match (&p1, &p2) {
                (Some(a), None) => (Some(a.clone()), true),
                (None, Some(b)) => (Some(b.clone()), true),
                (None, None) => (None, true),
                _ => (None, false),
            };

            bracket.push(TournamentMatch {
                id: format!("match-{}", match_counter),
                tournament_id: String::new(),
                round: round + 1,
                player1_id: p1,
                player2_id: p2,
                winner_id: winner,
                completed,
            });
        }
    }

    bracket
}

fn advance_winner(tournament: &mut Tournament, completed_match_idx: usize, winner_id: &str) {
    let completed_match = &tournament.bracket[completed_match_idx];
    let completed_round = completed_match.round;
    let completed_position = completed_match_idx;

    let next_round = completed_round + 1;
    let next_match_idx = tournament.bracket.iter().position(|m| {
        m.round == next_round
    });

    if let Some(next_idx) = next_match_idx {
        let next_match = &mut tournament.bracket[next_idx];
        if next_match.player1_id.is_none() {
            next_match.player1_id = Some(winner_id.to_string());
        } else if next_match.player2_id.is_none() {
            next_match.player2_id = Some(winner_id.to_string());
        }

        if next_match.player1_id.is_some() && next_match.player2_id.is_some() {
            next_match.completed = false;
        }
    }
}

fn calculate_prize_pool(entry_fee: f64, max_participants: u32) -> f64 {
    (entry_fee * max_participants as f64) * (1.0 - PLATFORM_FEE_PCT)
}

fn now_secs() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
}
