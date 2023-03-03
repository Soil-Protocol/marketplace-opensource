import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

function createData(price, date, from) {
  return {
    price, date, from,
  };
}

const rows = [
  createData('Frozen yoghurt', '2 Days Ago', 'Do'),
  createData('Ice cream sandwich', '1 Days Ago', 'Messari'),
  createData('Eclair', '1 Days Ago', 'Larry0x'),
  createData('Cupcake', '1 Days Ago', 'Delphi'),
  createData('Gingerbread', '1 Days Ago', 'Somnbus'),
];

export default function BaseTable() {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Price</TableCell>
            <TableCell align="right">Auction Date</TableCell>
            <TableCell align="right">From</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.from}>
              <TableCell component="th" scope="row">
                {row.price}
              </TableCell>
              <TableCell align="right">{row.date}</TableCell>
              <TableCell align="right">{row.from}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
