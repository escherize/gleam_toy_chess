import gleam/dict.{type Dict}
import gleam/io
import gleam/list
import gleam/result
import piece.{type Piece, Piece}
import point.{type Point}
import team

pub type Board =
  Dict(Point, Piece)

pub fn starting_row(b: Board, y: Int, t: team.Team) -> Board {
  b
  |> dict.insert(point.new_ok(1, y), piece.new(t, piece.Rook))
  |> dict.insert(point.new_ok(2, y), piece.new(t, piece.Knight))
  |> dict.insert(point.new_ok(3, y), piece.new(t, piece.Bishop))
  |> dict.insert(point.new_ok(4, y), piece.new(t, piece.Queen))
  |> dict.insert(point.new_ok(5, y), piece.new(t, piece.King))
  |> dict.insert(point.new_ok(6, y), piece.new(t, piece.Bishop))
  |> dict.insert(point.new_ok(7, y), piece.new(t, piece.Knight))
  |> dict.insert(point.new_ok(8, y), piece.new(t, piece.Rook))
}

pub fn starting_pawns(board: Board, y: Int, t: team.Team) -> Board {
  list.fold(point.indexes(), board, fn(b, f) {
    let assert Ok(point) = point.new(f, y)
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

pub fn set(board: Board, position: point.Point, piece: Piece) -> Board {
  dict.insert(board, position, piece)
}

pub fn delete(board: Board, position: point.Point) -> Board {
  dict.delete(board, position)
}
