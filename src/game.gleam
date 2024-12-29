import board
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import piece
import point.{type Point}
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
  pos: point.Point,
  piece: piece.Piece,
) -> List(Result(point.Point, String)) {
  []
  // TODO: remove more invalid moves:
  // - moves that would put the king in check
  // - moves that would put the king ontop of his own team's piece
}

pub fn legal_moves(game: Game, pos: point.Point) -> List(point.Point) {
  case board.get(game.board, pos) {
    Ok(piece) -> {
      case piece.kind {
        piece.King -> []
        //king_moves(game.board, pos, piece)
        piece.Bishop -> []
        piece.Knight -> []
        piece.Pawn -> {
          []
        }
        piece.Queen -> []
        piece.Rook -> []
      }
    }
    // no valid moves for empty squares
    Error(_) -> []
  }
}
