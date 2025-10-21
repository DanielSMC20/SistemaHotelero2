import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms'; 
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular,FormsModule],

})
export class ReportsComponent implements OnInit {
  gridApi!: GridApi;
  selectedDate: string = format(new Date(), 'yyyy-MM-dd');

  rowData: any[] = [];
  totalIncome: number = 0;

  columnDefs: ColDef[] = [
    { field: 'room', headerName: 'Habitación', flex: 1 },
    { field: 'guest', headerName: 'Nombres y apellidos', flex: 1 },
    { field: 'dniruc', headerName: 'DNI/RUC', flex: 1 },
    { field: 'checkIn', headerName: 'Check-in', flex: 1 },
    { field: 'checkOut', headerName: 'Check-out', flex: 1 },
    { field: 'pay', headerName: 'Meotodo de pago', flex: 1 },
    { field: 'price', headerName: 'Precio (S/)', flex: 1 }
  ];

  ngOnInit(): void {
    // 🔹 Aquí puedes traer los datos reales desde tu backend
    this.rowData = [
      { room: '101', guest: 'Saúl Medina', dniruc:'85475424', checkIn: '2025-10-17', checkOut: '2025-10-19', pay:'yape', price: 180 },
      { room: '102', guest: 'Daniel Castro', dniruc:'6532541257',checkIn: '2025-10-18', checkOut: '2025-10-20', pay:'transferencia',price: 250 },
    ];
    this.calculateTotal();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  calculateTotal() {
    this.totalIncome = this.rowData.reduce((acc, item) => acc + item.price, 0);
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.rowData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Diario');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fileName = `Reporte_${this.selectedDate}.xlsx`;
    saveAs(blob, fileName);
  }
}
