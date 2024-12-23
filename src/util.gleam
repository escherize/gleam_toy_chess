import gleam/list

pub fn cartesian_product(list1: List(a), list2: List(b)) -> List(#(a, b)) {
  list1
  |> list.map(fn(x) { list.map(list2, fn(y) { #(x, y) }) })
  |> list.flatten
}
