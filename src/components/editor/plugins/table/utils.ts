import { Schema, Node } from "@milkdown/kit/prose/model"
import { EditorState, Transaction } from "@milkdown/kit/prose/state"

export const insertTable = (
  schema: Schema,
  state: EditorState,
  dispatch: (tr: Transaction) => void
) => {
  const { table, table_row, table_cell, table_header } = schema.nodes
  if (!table || !table_row || !table_cell || !table_header) {
    return
  }

  const createRow = (isHeader: boolean) => {
    const cellType = isHeader ? table_header : table_cell
    const cells = Array(3)
      .fill(0)
      .map(() => cellType.createAndFill())
      .filter((n): n is Node => !!n)
    return table_row.create(null, cells)
  }

  const tableNode = table.create(null, [
    createRow(true),
    createRow(false),
    createRow(false),
  ])

  const trTable = state.tr.replaceSelectionWith(tableNode)
  dispatch(trTable)
}
