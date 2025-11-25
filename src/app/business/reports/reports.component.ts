import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { ReportInfrastructure } from './infraestructure/report.infraestructure';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular, FormsModule],
})
export class ReportsComponent implements OnInit {
  gridApi!: GridApi;
  selectedDate: string = format(new Date(), 'yyyy-MM-dd');
  rowData: any[] = [];
  totalIncome: number = 0;

  columnDefs: ColDef[] = [
    { field: 'roomNumber', headerName: 'Habitación', flex: 1 },
    { field: 'guestName', headerName: 'Nombres y apellidos', flex: 1 },
    { field: 'dni', headerName: 'DNI/RUC', flex: 1 },
    { field: 'checkIn', headerName: 'Check-in', flex: 1 },
    { field: 'checkOut', headerName: 'Check-out', flex: 1 },
    { field: 'price', headerName: 'Precio (S/)', flex: 1 },
    { field: 'usuarioRegistro', headerName: 'Atendido por', flex: 1 },
  ];

  constructor(private reportInfra: ReportInfrastructure) {}

  ngOnInit(): void {
    this.loadReport();

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  loadReport() {
    const start = this.selectedDate;
    const end = this.selectedDate; // Mismo día (reporte diario)

    this.reportInfra.getRevenue(start, end).subscribe({
      next: (res: any) => {
  console.log("RESPONSE:", res);

  this.rowData = res.data.map((x: any) => ({
    roomNumber: x.roomNumber ?? x.habitacion ?? '-',
    guestName: x.guestName ?? x.nombres ?? '-',
    dni: x.dni ?? x.documento ?? '-',
    checkIn: x.checkIn ?? x.fechaCheckIn ?? '-',
    checkOut: x.checkOut ?? x.fechaCheckOut ?? '-',
    paymentMethod: x.paymentMethod ?? x.metodoPago ?? '-',
    price: x.price ?? x.precio ?? 0,
    usuarioRegistro: x.usuarioRegistro ?? x.usuarioRegistro ?? '-',
  }));

  this.calculateTotal();
},

      error: (err) => {
        console.error('Error al cargar reporte', err);
      },
    });
  }

  calculateTotal() {
    this.totalIncome = this.rowData.reduce((acc, item) => acc + (item.price || 0), 0);
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
