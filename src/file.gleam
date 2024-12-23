import gleam/int

pub type File {
  A
  B
  C
  D
  E
  F
  G
  H
}

pub fn files() -> List(File) {
  [H, G, F, E, D, C, B, A]
}

pub fn to_int(f: File) -> Int {
  case f {
    A -> 1
    B -> 2
    C -> 3
    D -> 4
    E -> 5
    F -> 6
    G -> 7
    H -> 8
  }
}

pub fn to_string(f: File) -> String {
  case f {
    A -> "A"
    B -> "B"
    C -> "C"
    D -> "D"
    E -> "E"
    F -> "F"
    G -> "G"
    H -> "H"
    _ -> "Invalid file in to_string"
  }
}

pub fn parse(s: String) -> Result(File, String) {
  case s {
    "A" -> Ok(A)
    "B" -> Ok(B)
    "C" -> Ok(C)
    "D" -> Ok(D)
    "E" -> Ok(E)
    "F" -> Ok(F)
    "G" -> Ok(G)
    "H" -> Ok(H)
    _ -> Error("Invalid file in parse")
  }
}

pub fn add(f1: File, f2: File) -> Result(File, String) {
  let sum = to_int(f1) + to_int(f2)
  case sum {
    1 -> Ok(A)
    2 -> Ok(B)
    3 -> Ok(C)
    4 -> Ok(D)
    5 -> Ok(E)
    6 -> Ok(F)
    7 -> Ok(G)
    8 -> Ok(H)
    x -> Error("Off the board: file# " <> int.to_string(x))
  }
}
