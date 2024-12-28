import file
import gleam/dict.{type Dict}
import gleam/list
import gleam/result
import piece.{type Piece, Piece}
import position.{type Position, Position}
import rank
import team

pub type Board =
  Dict(Position, Piece)

pub fn starting_row(b: Board, r: rank.Rank, t: team.Team) -> Board {
  b
  |> dict.insert(Position(file.A, r), piece.new(t, piece.Rook))
  |> dict.insert(Position(file.B, r), piece.new(t, piece.Knight))
  |> dict.insert(Position(file.C, r), piece.new(t, piece.Bishop))
  |> dict.insert(Position(file.D, r), piece.new(t, piece.Queen))
  |> dict.insert(Position(file.E, r), piece.new(t, piece.King))
  |> dict.insert(Position(file.F, r), piece.new(t, piece.Bishop))
  |> dict.insert(Position(file.G, r), piece.new(t, piece.Knight))
  |> dict.insert(Position(file.H, r), piece.new(t, piece.Rook))
}

pub fn starting_pawns(board: Board, r: rank.Rank, t: team.Team) -> Board {
  list.fold(file.files(), board, fn(b, f) {
    dict.insert(b, Position(f, r), piece.new(t, piece.Pawn))
  })
}

pub fn new_board() -> Board {
  let assert Ok(white_start) = rank.new(1)
  let assert Ok(black_start) = rank.new(8)
  let assert Ok(white_pawns) = rank.new(2)
  let assert Ok(black_pawns) = rank.new(7)
  dict.new()
  |> starting_row(white_start, team.White)
  |> starting_pawns(white_pawns, team.White)
  |> starting_row(black_start, team.Black)
  |> starting_pawns(black_pawns, team.Black)
}

pub fn get(board: Board, position: Position) -> Result(Piece, String) {
  dict.get(board, position)
  |> result.map_error(fn(_) { "No piece at position" })
}
