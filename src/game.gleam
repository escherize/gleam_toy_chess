import board.{type Board}
import gleam/dict
import gleam/io
import gleam/list
import gleam/option.{type Option, None}
import gleam/result
import piece.{type Piece, Bishop, King, Knight, Pawn, Queen, Rook}
import point.{type Point, Point}
import team.{type Team, Black, White}

pub type GameState {
  Selected(point.Point)
  Idle
}

pub type Game {
  Game(
    board: Board,
    team_turn: Team,
    check: Option(Bool),
    winner: Option(Team),
    mode: GameState,
  )
}

pub fn new() -> Game {
  Game(
    board: board.new_board(),
    team_turn: White,
    check: None,
    winner: None,
    mode: Idle,
  )
}

// Utils:

pub fn forward(piece: Piece) -> Int {
  case piece.team {
    Black -> -1
    White -> 1
  }
}

pub fn remove_blanks(legal_moves, board) -> List(Point) {
  list.filter(legal_moves, fn(p) { board.get(board, p) |> result.is_ok })
}

pub fn remove_pieces(legal_moves, board) -> List(Point) {
  list.filter(legal_moves, fn(p) { board.get(board, p) |> result.is_error })
}

pub fn remove_pieces_on_team(legal_moves, board, team) -> List(Point) {
  list.filter(legal_moves, fn(point) {
    case board.get(board, point) {
      Ok(piece) -> piece.team != team
      Error(_) -> True
    }
  })
}

pub fn point_on_board(point: Point) -> Bool {
  point.x > 0 && point.x < 9 && point.y > 0 && point.y < 9
}

pub fn do_step_until(
  acc: List(Point),
  board: Board,
  start: Point,
  piece: Piece,
  direction: #(Int, Int),
) -> List(Point) {
  let next_pos = Point(start.x + direction.0, start.y + direction.1)
  case point_on_board(next_pos) {
    True -> {
      case board.get(board, next_pos) {
        Ok(next_piece) ->
          case next_piece.team == piece.team {
            // stop if we hit a piece of the same team
            True -> acc
            // include `next_pos` if it's a piece of the opposite team, since we can eat them!
            False -> [next_pos, ..acc]
          }
        Error(_) ->
          do_step_until([next_pos, ..acc], board, next_pos, piece, direction)
      }
    }
    False -> acc
  }
}

pub fn step_until(
  board: Board,
  start: Point,
  piece: Piece,
  direction: #(Int, Int),
) -> List(Point) {
  do_step_until([], board, start, piece, direction)
}

pub fn all_team_pieces(board: Board, team: Team) -> List(Point) {
  board
  |> dict.keys
  |> list.filter(fn(point) {
    case board.get(board, point) {
      Ok(piece) -> piece.team == team
      Error(_) -> False
    }
  })
}

pub fn in_check(on board: Board, at pos: Point, for team: Team) -> Bool {
  let enemy_team = team.opposite(team)
  let enemy_pieces = all_team_pieces(board, enemy_team)

  list.any(enemy_pieces, fn(enemy_pos) {
    case board.get(board, enemy_pos) {
      Ok(piece) -> {
        let moves = legal_moves(Game(board, team, None, None, Idle), enemy_pos)
        list.contains(moves, pos)
      }
      Error(_) -> False
    }
  })
}

// Pieces:

pub fn knight_moves(board: Board, pos: Point, piece: Piece) -> List(Point) {
  let moves = [
    Point(pos.x + 1, pos.y + 2),
    Point(pos.x + 2, pos.y + 1),
    Point(pos.x + 2, pos.y - 1),
    Point(pos.x + 1, pos.y - 2),
    Point(pos.x - 1, pos.y - 2),
    Point(pos.x - 2, pos.y - 1),
    Point(pos.x - 2, pos.y + 1),
    Point(pos.x - 1, pos.y + 2),
  ]

  moves
  |> remove_pieces_on_team(board, piece.team)
  |> list.filter(point_on_board)
}

pub fn rook_moves(board: Board, pos: Point, piece: Piece) -> List(Point) {
  [#(1, 0), #(0, 1), #(-1, 0), #(0, -1)]
  |> list.flat_map(fn(direction) { step_until(board, pos, piece, direction) })
}

pub fn bishop_moves(board: Board, pos: Point, piece: Piece) -> List(Point) {
  [#(1, 1), #(-1, 1), #(-1, -1), #(1, -1)]
  |> list.flat_map(fn(direction) { step_until(board, pos, piece, direction) })
}

pub fn king_moves(board: Board, pos: Point, piece: Piece) -> List(Point) {
  let moves = [
    Point(pos.x + 1, pos.y),
    Point(pos.x + 1, pos.y + 1),
    Point(pos.x, pos.y + 1),
    Point(pos.x - 1, pos.y + 1),
    Point(pos.x - 1, pos.y),
    Point(pos.x - 1, pos.y - 1),
    Point(pos.x, pos.y - 1),
    Point(pos.x + 1, pos.y - 1),
  ]

  moves
  |> list.filter(point_on_board)
  |> remove_pieces_on_team(board, piece.team)
  // TODO: does the king properly check if it's in check?
  |> list.filter(fn(point) { !in_check(at: point, on: board, for: piece.team) })
}

/// if the pawn can step 2, but has a piece directly in front of it, remove both steps
pub fn remove_blocked_pawn_step(moves: List(Point), board: Board) -> List(Point) {
  case list.first(moves) {
    Error(_) -> []
    Ok(point) -> {
      case board.get(board, point) {
        Ok(_) -> []
        Error(_) -> moves
      }
    }
  }
}

fn pawn_attack_positions(board: Board, pos: Point, piece: Piece) -> List(Point) {
  let dir = forward(piece)
  [Point(pos.x + 1, pos.y + dir), Point(pos.x - 1, pos.y + dir)]
  |> list.filter(fn(point) { point_on_board(point) })
  |> remove_blanks(board)
}

pub fn pawn_moves(board: Board, pos: Point, piece: Piece) -> List(Point) {
  {
    let dir = forward(piece)
    let steps =
      case pos.y, piece.team {
        // white pawns can move 2 steps from row 2
        // black pawns can move 2 steps from row 7
        2, White | 7, Black -> [
          Point(pos.x, pos.y + dir),
          Point(pos.x, pos.y + dir + dir),
        ]
        _, _ -> [Point(pos.x, pos.y + dir)]
      }
      |> remove_blocked_pawn_step(board)
      |> remove_pieces(board)

    let attacks =
      pawn_attack_positions(board, pos, piece)
      |> remove_pieces_on_team(board, piece.team)
    list.append(steps, attacks)
  }
}

pub fn legal_moves(game: Game, pos: Point) -> List(Point) {
  case board.get(game.board, pos) {
    Ok(piece) -> {
      //io.debug(piece)
      case piece.kind {
        King -> king_moves(game.board, pos, piece)
        //king_moves(game.board, pos, piece)
        Bishop -> bishop_moves(game.board, pos, piece)
        Knight -> knight_moves(game.board, pos, piece)
        Pawn -> pawn_moves(game.board, pos, piece) |> io.debug
        Queen ->
          list.append(
            bishop_moves(game.board, pos, piece),
            rook_moves(game.board, pos, piece),
          )
        Rook -> rook_moves(game.board, pos, piece)
      }
    }
    // no valid moves for empty squares
    Error(_) -> []
  }
}
