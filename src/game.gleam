import board
import coordinate
import file.{A}
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import piece
import position.{type Position}
import rank
import team
import util

pub type Game {
  Game(
    board: board.Board,
    team_turn: team.Team,
    check: Option(Bool),
    winner: Option(team.Team),
  )
}

pub fn new() -> Game {
  Game(
    board: board.new_board(),
    team_turn: team.White,
    check: None,
    winner: None,
  )
}

pub fn king_moves(
  _board: board.Board,
  pos: Position,
  piece: piece.Piece,
) -> List(Result(Position, String)) {
  list.map(coordinate.dirs(), fn(step) {
    coordinate.pos_add(pos, step, piece.team)
  })
  // TODO: remove more invalid moves:
  // - moves that would put the king in check
  // - moves that would put the king ontop of his own team's piece
}

pub fn legal_moves(game: Game, pos: Position) -> List(Position) {
  case board.get(game.board, pos) {
    Ok(piece) -> {
      case piece.kind {
        piece.King -> []
        //king_moves(game.board, pos, piece)
        piece.Bishop -> []
        piece.Knight -> []
        piece.Pawn -> {
          [coordinate.pos_add(pos, coordinate.Forward, piece.team)]
          |> result.values
        }
        piece.Queen -> []
        piece.Rook -> []
      }
    }
    // no valid moves for empty squares
    Error(_) -> []
  }
}
