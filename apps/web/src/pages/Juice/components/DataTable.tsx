import { ReactNode } from 'react'
import { Flex, Text, styled } from 'ui/src'

interface DataTableProps {
  headers: string[]
  rows: (string | ReactNode)[][]
}

const TableContainer = styled(Flex, {
  flexDirection: 'column',
  borderRadius: '$rounded16',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '$surface3',
  width: '100%',
})

const TableRow = styled(Flex, {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',

  variants: {
    isHeader: {
      true: {
        backgroundColor: '$surface2',
      },
      false: {
        backgroundColor: '$surface1',
      },
    },
  } as const,
})

const TableCell = styled(Flex, {
  flex: 1,
  padding: '$spacing12',
  minWidth: 100,
})

export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <TableContainer>
      <TableRow isHeader>
        {headers.map((header, i) => (
          <TableCell key={i}>
            <Text variant="body2" color="$neutral1" fontWeight="600">
              {header}
            </Text>
          </TableCell>
        ))}
      </TableRow>
      {rows.map((row, rowIndex) => (
        <TableRow key={rowIndex} isHeader={false}>
          {row.map((cell, cellIndex) => (
            <TableCell key={cellIndex}>
              {typeof cell === 'string' ? (
                <Text variant="body2" color="$neutral2">
                  {cell}
                </Text>
              ) : (
                cell
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableContainer>
  )
}
