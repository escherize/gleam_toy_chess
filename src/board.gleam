import gleam/dict.{type Dict}
import gleam/io
import gleam/list
import gleam/result
import piece.{type Piece, Piece}
import point.{type Point}
import team

pub type Board =
  Dict(Point, Piece)

pub fn starting_row(b: Board, r: point.Rank, t: team.Team) -> Board {
  b
  |> dict.insert(point.new_ok(r, 1), piece.new(t, piece.Rook))
  |> dict.insert(point.new_ok(r, 2), piece.new(t, piece.Knight))
  |> dict.insert(point.new_ok(r, 3), piece.new(t, piece.Bishop))
  |> dict.insert(point.new_ok(r, 4), piece.new(t, piece.Queen))
  |> dict.insert(point.new_ok(r, 5), piece.new(t, piece.King))
  |> dict.insert(point.new_ok(r, 6), piece.new(t, piece.Bishop))
  |> dict.insert(point.new_ok(r, 7), piece.new(t, piece.Knight))
  |> dict.insert(point.new_ok(r, 8), piece.new(t, piece.Rook))
}

pub fn starting_pawns(board: Board, r: point.Rank, t: team.Team) -> Board {
  point.indexes() |> io.debug
  list.fold(point.indexes(), board, fn(b, f) {
    io.debug(#(r, f))
    let assert Ok(point) = point.new(r, f)
    dict.insert(b, point, piece.new(t, piece.Pawn))
  })
}

pub fn new_board() -> Board {
  dict.new()
  |> starting_row(1, team.White)
  |> starting_pawns(2, team.White)
  |> starting_row(8, team.Black)
  |> starting_pawns(7, team.Black)
}

pub fn get(board: Board, position: point.Point) -> Result(Piece, String) {
  dict.get(board, position)
  |> result.map_error(fn(_) { "No piece at position" })
}
