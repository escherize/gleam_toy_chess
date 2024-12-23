import file
import gleam/dict.{type Dict}
import gleam/list
import piece.{type Piece, Piece}
import position.{type Position, Position}
import rank
import team

pub type Board =
  Dict(Position, Piece)

pub fn insert_starting_row(b: Board, f: file.File, t: team.Team) -> Board {
  b
  |> dict.insert(Position(rank.from_int(1), f), Piece(t, piece.Rook))
  |> dict.insert(Position(rank.from_int(2), f), Piece(t, piece.Knight))
  |> dict.insert(Position(rank.from_int(3), f), Piece(t, piece.Bishop))
  |> dict.insert(Position(rank.from_int(4), f), Piece(t, piece.Queen))
  |> dict.insert(Position(rank.from_int(5), f), Piece(t, piece.King))
  |> dict.insert(Position(rank.from_int(6), f), Piece(t, piece.Bishop))
  |> dict.insert(Position(rank.from_int(7), f), Piece(t, piece.Knight))
  |> dict.insert(Position(rank.from_int(8), f), Piece(t, piece.Rook))
}

pub fn insert_pawn_row(board: Board, f: file.File, t: team.Team) -> Board {
  let files = list.range(1, 8) |> list.map(rank.from_int(_))
  list.fold(files, board, fn(b, rank) {
    dict.insert(b, Position(rank, f), piece.Piece(t, piece.Pawn))
  })
}

pub fn new_board() -> Board {
  let board = dict.new()
  board
  |> insert_starting_row(file.A, team.White)
  |> insert_starting_row(file.H, team.Black)
  |> insert_pawn_row(file.B, team.White)
  |> insert_pawn_row(file.G, team.Black)
}

pub fn board_get(board: Board, position: Position) -> Result(Piece, Nil) {
  dict.get(board, position)
}
