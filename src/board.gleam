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
  list.fold(
    [
      #(1, piece.Rook),
      #(2, piece.Knight),
      #(3, piece.Bishop),
      #(4, piece.Queen),
      #(5, piece.King),
      #(6, piece.Bishop),
      #(7, piece.Knight),
      #(8, piece.Rook),
    ],
    b,
    fn(b, ip) {
      dict.insert(b, Position(rank.from_int(ip.0), f), Piece(t, ip.1))
    },
  )
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
