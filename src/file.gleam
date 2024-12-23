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
