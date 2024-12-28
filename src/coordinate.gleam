import file
import gleam/int
import gleam/result
import position.{type Position}
import rank
import team.{type Team, Black, White}

/// The x and y coordinates of a chess piece, used for rendering
pub opaque type Coordinate {
  Coordinate(x: Int, y: Int)
}

pub fn new(x: Int, y: Int) -> Result(Coordinate, String) {
  case x >= 1, x <= 8, y >= 1, y <= 8 {
    True, True, True, True -> Ok(Coordinate(x, y))
    _, _, _, _ ->
      Error(
        "invalid coordinate:" <> int.to_string(x) <> ", " <> int.to_string(y),
      )
  }
}

pub type Direction {
  Forward
  ForwardLeft
  ForwardRight
  Backward
  BackwardLeft
  BackwardRight
  Left
  Right
}

pub fn dirs() -> List(Direction) {
  [
    Forward,
    ForwardLeft,
    ForwardRight,
    Backward,
    BackwardLeft,
    BackwardRight,
    Left,
    Right,
  ]
}

pub fn from_pos(pos: Position) -> Coordinate {
  Coordinate(file.to_int(pos.file), rank.to_int(pos.rank))
}

pub fn to_pos(c: Coordinate) -> Result(Position, String) {
  position.new(file.from_int(c.x), rank.new(c.y))
}

pub fn pos_add(p: Position, d: Direction, t: Team) -> Result(Position, String) {
  p |> from_pos |> add(d, t) |> to_pos
}

pub fn add(c: Coordinate, d: Direction, t: Team) -> Coordinate {
  case t, d {
    Black, Forward -> Coordinate(c.x, c.y + 1)
    Black, ForwardLeft -> Coordinate(c.x - 1, c.y + 1)
    Black, ForwardRight -> Coordinate(c.x + 1, c.y + 1)
    Black, Backward -> Coordinate(c.x, c.y - 1)
    Black, BackwardLeft -> Coordinate(c.x - 1, c.y - 1)
    Black, BackwardRight -> Coordinate(c.x + 1, c.y - 1)
    White, Forward -> Coordinate(c.x, c.y - 1)
    White, ForwardLeft -> Coordinate(c.x - 1, c.y - 1)
    White, ForwardRight -> Coordinate(c.x + 1, c.y - 1)
    White, Backward -> Coordinate(c.x, c.y + 1)
    White, BackwardLeft -> Coordinate(c.x - 1, c.y + 1)
    White, BackwardRight -> Coordinate(c.x + 1, c.y + 1)
    _, Left -> Coordinate(c.x - 1, c.y)
    _, Right -> Coordinate(c.x + 1, c.y)
  }
}
