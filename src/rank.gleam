import gleam/int
import gleam/io
import gleam/result

pub opaque type Rank {
  Rank(Int)
}

pub fn new(i: Int) -> Rank {
  case i {
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 -> Rank(i)
    _ -> {
      io.debug(#("rank/new", i))
      panic as "Invalid rank!"
    }
  }
}

pub fn to_int(rank: Rank) -> Int {
  case rank {
    Rank(i) -> i
  }
}

pub fn to_string(rank: Rank) -> String {
  rank
  |> to_int
  |> int.to_string
}

pub fn parse(s: String) -> Result(Rank, String) {
  case s {
    "1" -> Ok(Rank(1))
    "2" -> Ok(Rank(2))
    "3" -> Ok(Rank(3))
    "4" -> Ok(Rank(4))
    "5" -> Ok(Rank(5))
    "6" -> Ok(Rank(6))
    "7" -> Ok(Rank(7))
    "8" -> Ok(Rank(8))
    _ -> Error("invalid input to rank/parse: " <> s)
  }
}

pub fn ranks() -> List(Rank) {
  [Rank(1), Rank(2), Rank(3), Rank(4), Rank(5), Rank(6), Rank(7), Rank(8)]
}

pub fn add(r1: Rank, r2: Rank) -> Result(Rank, String) {
  case to_int(r1) + to_int(r2) {
    1 -> Ok(Rank(1))
    2 -> Ok(Rank(2))
    3 -> Ok(Rank(3))
    4 -> Ok(Rank(4))
    5 -> Ok(Rank(5))
    6 -> Ok(Rank(6))
    7 -> Ok(Rank(7))
    8 -> Ok(Rank(8))
    x ->
      Error(
        "invalid input to rank/add: "
        <> to_string(r1)
        <> " + "
        <> to_string(r2)
        <> " = "
        <> int.to_string(x),
      )
  }
}
