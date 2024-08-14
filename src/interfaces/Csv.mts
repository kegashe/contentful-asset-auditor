/**
 * Stores the CSV object
 * @property {Column[]} columns - Contains the column data.
 * @property {Row[]} rows - Contains the row data.
 */
export interface Csv {
	columns: Array<Column>,
	rows: Array<Row>,
};

/**
 * Stores data of a single column
 * @property {string} name - Name of the column.
 * @property {integer} order - Cardinal order of the column.
 */
export interface Column {
	name: string,
	order: number,
};

/**
 * Stores data of a single row (array of cells)
 * @property {number} number - The number of the row.
 * @property {Cell[]} cells - Collection of Cell items.
 */
export interface Row {
	number: number,
	cells: Array<Cell>,
};

/**
 * Stores data of a single cell
 * @property {Column['name']} column - Name of the column the cell belongs to.
 * @property {string | integer | boolean} value - Value of the cell.
 */
export interface Cell {
	column: Column['name'],
	value: string | number | boolean,
};

/**
 * Adds a column to a Csv object
 * @method
 * @param {Csv} csv - Contains the Csv object.
 * @param {Column} column - Contains the column property data.
 * @returns {void}
 */
export function addColumn(csv: Csv, column: Column): void {

	const orderExists: Column | undefined = csv.columns.find((c: Column): boolean => c.order === column.order);

	if (orderExists) {
		const otherColumns: Array<Column> = csv.columns.filter((c: Column): boolean => c.order >= column.order);

		otherColumns.forEach((c: Column): number => c.order++);
	}

	csv.columns.push(
		{
			order: column.order || 0,
			name: column.name || 'New Column'
		}
	);
}

/** 
 * Adds a row to the CSV object
 * @method
 * @param {Csv} csv - Contains the Csv object.
 * @param {Row} row - Contains row cell data.
 * @return {void}
 */
export function addRow(csv: Csv, row: Row): void {
	const newRow: Row = {
		number: 0,
		cells: [],
	};
	const newRowNumber = csv
		.rows
		.length++;
	const newRowCells = row
		.cells
		.map(
			function (cell: Cell): Cell {
				if (typeof cell.value === 'string') {
					cell.value = cell.value.replace(/,/g, '');
				}
				return cell;
			}
		);

	newRow.number = newRowNumber;
	newRow.cells = newRowCells;

	csv.rows.push(newRow);
}

/** Renders the data as CSV-formatted string
 * @method
 * @param {Csv} csv - Contains the Csv object.
 * @returns {string} - CSV-formatted string.
 */
export function render(csv: Csv): string {
	let data: string = '';

	csv.columns.sort((a, b) => a.order - b.order);

	for (let c = 0; c < csv.columns.length; c++) {
		data += csv.columns[c]['name'];

		if (c === csv.columns.length - 1) {
			data += '\n';
		} else {
			data += ',';
		}
	}

	csv.rows.forEach(
		function (r: Row): void {
			for (let i = 0; i < csv.columns.length; i++) {
				data += r.cells.find(
					function (cell: Cell): boolean {
						return cell['column'] === csv.columns[i]['name'];
					}
				)?.['value'];

				if (i < csv.columns.length - 1) {
					data += ',';
				}
			}

			data += '\n';
		}
	);

	return data;
}