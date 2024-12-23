import file
import gleam/dict.{type Dict}
import gleam/list
import piece.{type Piece, Piece}
import position.{type Position, Position}
import rank
import team

pub type Board =
  Dict(Position, Piece)

pub fn starting_row(b: Board, r: rank.Rank, t: team.Team) -> Board {
  list.fold(
    [
      #(file.A, piece.Rook),
      #(file.B, piece.Knight),
      #(file.C, piece.Bishop),
      #(file.D, piece.Queen),
      #(file.E, piece.King),
      #(file.F, piece.Bishop),
      #(file.G, piece.Knight),
      #(file.H, piece.Rook),
    ],
    b,
    fn(b, iif) { dict.insert(b, Position(iif.0, r), piece.new(t, iif.1)) },
  )
}

pub fn starting_pawns(board: Board, r: rank.Rank, t: team.Team) -> Board {
  list.fold(file.files(), board, fn(b, f) {
    dict.insert(b, Position(f, r), piece.new(t, piece.Pawn))
  })
}

pub fn new_board() -> Board {
  dict.new()
  |> starting_row(rank.new(1), team.White)
  |> starting_pawns(rank.new(2), team.White)
  |> starting_row(rank.new(8), team.Black)
  |> starting_pawns(rank.new(7), team.Black)
}

pub fn get(board: Board, position: Position) -> Result(Piece, Nil) {
  dict.get(board, position)
}
