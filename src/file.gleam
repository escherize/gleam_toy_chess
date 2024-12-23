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

pub fn from_string(s: String) -> Result(File, String) {
  case s {
    "A" -> Ok(A)
    "B" -> Ok(B)
    "C" -> Ok(C)
    "D" -> Ok(D)
    "E" -> Ok(E)
    "F" -> Ok(F)
    "G" -> Ok(G)
    "H" -> Ok(H)
    _ -> Error("Invalid file in from_string")
  }
}
