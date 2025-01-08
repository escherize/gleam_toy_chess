//// Pawns

import board
import gleam/io
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import piece.{type Piece, Bishop, King, Knight, Pawn, Queen, Rook}
import point.{type Point, Point}
import team.{Black, White}
import util

pub type GameState {
  Selected(point.Point)
  Idle
}

pub type Game {
  Game(
    board: board.Board,
    team_turn: team.Team,
    check: Option(Bool),
    winner: Option(team.Team),
    mode: GameState,
  )
}

pub fn new() -> Game {
  Game(
    board: board.new_board(),
    team_turn: White,
    check: None,
    winner: None,
    mode: Idle,
  )
}

pub fn king_moves(
  _board: board.Board,
  pos: Point,
  piece: Piece,
) -> List(Result(Point, String)) {
  []
  // TODO: remove more invalid moves:
  // - moves that would put the king in check
  // - moves that would put the king ontop of his own team's piece
}

pub fn pawn_starting_position(team: team.Team, pos: Point) -> Bool {
  case pos.y, team {
    2, White -> True
    7, Black -> True
    _, _ -> False
  }
}

fn pawn_attack_positions(pos: Point, piece: Piece) -> List(Point) {
  case piece.team {
    Black -> [Point(pos.x + 1, pos.y - 1), Point(pos.x - 1, pos.y - 1)]
    White -> [Point(pos.x + 1, pos.y + 1), Point(pos.x - 1, pos.y + 1)]
  }
}

fn pawn_attacks(board: board.Board, team: team.Team, pos: Point) -> List(Point) {
  let to_check = case board.get(board, pos) {
    Ok(piece) -> pawn_attack_positions(pos, piece)
    Error(_) -> []
  }

  list.filter(to_check, fn(point) {
    case board.get(board, point) {
      Ok(piece) -> piece.team != team
      Error(_) -> False
    }
  })
}

pub fn remove_own_spaces(board, team, legal_moves) {
  legal_moves
}

pub fn legal_moves(game: Game, pos: Point) -> List(Point) {
  case board.get(game.board, pos) {
    Ok(piece) -> {
      //io.debug(piece)
      case piece.kind {
        King -> []
        //king_moves(game.board, pos, piece)
        Bishop -> []
        Knight -> []
        Pawn -> {
          let steps = case pawn_starting_position(game.team_turn, pos) {
            True -> {
              [Point(pos.x, pos.y + 1), Point(pos.x, pos.y + 2)]
            }
            False -> [Point(pos.x, pos.y + 1)]
          }
          let attacks = pawn_attacks_positions(game.board, game.team_turn, pos)
          list.append(attacks, steps)
        }
        Queen -> []
        Rook -> []
      }
    }
    // no valid moves for empty squares
    Error(_) -> []
  }
}
