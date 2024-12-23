import board
import file.{A}
import gleam/option.{type Option, None}
import gleam/result
import piece
import position
import rank
import team

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

pub fn legal_moves(
  game: Game,
  pos: position.Position,
) -> Result(List(position.Position), Nil) {
  use piece <- result.try(board.get(game.board, pos))
  case piece.kind {
    piece.Bishop -> Ok([])
    piece.King -> Ok([])
    piece.Knight -> Ok([])
    piece.Pawn -> {
     case piece.team {
       team.Black -> position.(pos)
       team.White -> todo
     }
    }
    piece.Queen -> Ok([])
    piece.Rook -> Ok([])
  }
}
