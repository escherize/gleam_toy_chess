import board
import file
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
    _ -> Ok([position.new(rank.from_int(1), file.A)])
    // piece.Bishop -> todo
    // piece.King -> todo
    // piece.Knight -> todo
    // piece.Pawn -> todo
    // piece.Queen -> todo
    // piece.Rook -> todo
  }
}
