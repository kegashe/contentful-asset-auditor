class Csv {
	constructor() {
		/**
		 * Stores the column names and order
		 * @property {Object[]} columns - Contains the column data.
		 * @property {string} columns[].name - Name of the column
		 * @property {integer} columns[].order - Cardinal order of the column.
		 */
		this.columns = [];

		/**
		 * Stores the row cell data.
		 * @property {Object[]} rows - Contains the row cell data.
		 * @property {string} column - Name of the column the cell belongs to.
		 * @property {string|integer|boolean} value - Value of the cell data.
		 */
		this.rows = [];

		/**
		 * Adds a column to the CSV object
		 * @method
		 * @param {Object} properties - Contains the column data.
		 * @param {string} properties.name - Name of the column.
		 * @param {integer} properties.order - Cardinal order of the column.
		 */
	}

	addColumn(properties) {
		const { name, order } = properties;

		const orderExists = this.columns.find(c => c.order === order);

		if (orderExists) {
			const otherColumns = this.columns.filter(c => c.order >= order);

			otherColumns.forEach((c) => c.order++);
		}

		this.columns.push({
			order: order || 0,
			name: name || 'column'
		});
	}

	/** 
	 * Adds a row to the CSV object
	 * @method
	 * @param {Object[]} data - Contains row cell data.
	 * @param {string} data[].column - The column name of the cell.
	 * @param {string} data[].value - The value of the cell.
	 */
	addRow(data) {
		const columnNames = this.columns.map(c => c.name);

		const rowExistingColumns = data.filter(c => columnNames.includes(c.column));

		const rowUniqueEntries = rowExistingColumns.filter((v, i, self) => {
			return i === self.findIndex((t) => {
				return t.column === v.column && t.name === v.name
			})
		});

		const rowSanitized = rowUniqueEntries.map((r) => {
			if (typeof r.value === 'string') {
				r.value = r.value.replaceAll(',', '')
			}
			return r;
		});

		const dataToWrite = rowSanitized;

		if (dataToWrite.length > 0) {
			this.rows.push(dataToWrite);
		}
	}

	/** Renders the data as CSV-formatted string
	 * @method
	 * @returns {string} - CSV-formatted string
	 */
	render() {
		let data = '';

		this.columns.sort((a, b) => a.order - b.order);

		for (let c = 0; c < this.columns.length; c++) {
			data += this.columns[c]['name'];

			if (c === this.columns.length - 1) {
				data += '\n';
			} else {
				data += ',';
			}
		}

		this.rows.forEach((r) => {
			for (let i = 0; i < this.columns.length; i++) {
				data += r.find(n => n['column'] === this.columns[i]['name'])['value'];

				if(i < this.columns.length - 1) {
					data += ',';
				}
			}

			data += '\n';
		});

		return data;
	}
}

module.exports = Csv;