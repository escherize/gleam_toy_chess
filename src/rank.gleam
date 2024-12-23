import gleam/io

pub opaque type Rank {
  Rank(Int)
}

pub fn from_int(i: Int) -> Rank {
  case i {
    1 -> Rank(1)
    2 -> Rank(2)
    3 -> Rank(3)
    4 -> Rank(4)
    5 -> Rank(5)
    6 -> Rank(6)
    7 -> Rank(7)
    8 -> Rank(8)
    _ -> {
      io.debug(#("rank/from_int", i))
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
  case rank {
    Rank(1) -> "1"
    Rank(2) -> "2"
    Rank(3) -> "3"
    Rank(4) -> "4"
    Rank(5) -> "5"
    Rank(6) -> "6"
    Rank(7) -> "7"
    Rank(8) -> "8"
    _ -> {
      io.debug(#("rank/to_string", rank))
      panic as "Impossible!"
    }
  }
}

pub fn ranks() -> List(Rank) {
  [Rank(1), Rank(2), Rank(3), Rank(4), Rank(5), Rank(6), Rank(7), Rank(8)]
}
