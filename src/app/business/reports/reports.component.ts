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
import { ReservationInfraestructure } from '../reservations/infraestructure/reservation.infraestructure'; // ajusta la ruta real
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular, FormsModule],
})
export class ReportsComponent implements OnInit {
  gridApi!: GridApi;
  start: string = format(new Date(), 'yyyy-MM-dd');
  end: string = format(new Date(), 'yyyy-MM-dd');
  rowData: any[] = [];
  totalIncome: number = 0;

  // 👇 contexto para usar métodos del componente desde el cellRenderer
  context: any = { componentParent: this };

  columnDefs: ColDef[] = [
    { field: 'roomNumber', headerName: 'Habitación', flex: 1 },
    { field: 'guestName', headerName: 'Nombres y apellidos', flex: 1 },
    { field: 'dni', headerName: 'DNI/RUC', flex: 1 },
    { field: 'checkIn', headerName: 'Check-in', flex: 1 },
    { field: 'checkOut', headerName: 'Check-out', flex: 1 },
    { field: 'price', headerName: 'Precio (S/)', flex: 1 },
    { field: 'usuarioRegistro', headerName: 'Atendido por', flex: 1 },

    // ✅ Botón para ver comprobante
    {
      headerName: 'Comprobante de pago',
      field: 'paymentId',
      flex: 1,
      cellRenderer: (params: any) => {
        if (!params.value) {
          return '-';
        }

        const button = document.createElement('button');
        button.innerText = 'Ver comprobante';
        button.className =
          'px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700';

        button.addEventListener('click', () => {
          const comp = params.context.componentParent as ReportsComponent;
          comp.onDownloadReceipt(params.value);
        });

        return button;
      },
    },
  ];

  constructor(
    private reportInfra: ReportInfrastructure,
    private reservationInfra: ReservationInfraestructure
  ) {}

  defaultColDef: ColDef = {
    sortable: true,
    filter: true, // habilita filtros en cada columna
    floatingFilter: true, // muestra la cajita de filtro debajo del header
    resizable: true,
  };
  ngOnInit(): void {
    this.loadReport();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;

    // Nos aseguramos que el contexto quede cargado
    this.gridApi.setGridOption('context', this.context);
  }

  loadReport() {
    const start = this.start;
    const end = this.end; // Mismo día (reporte diario)

    this.reportInfra.getRevenue(start, end).subscribe({
      next: (res: any) => {
        console.log('RESPONSE:', res);

        this.rowData = res.data.map((x: any) => ({
          roomNumber: x.roomNumber ?? '-',
          guestName: x.guestName ?? '-',
          dni: x.dni ?? '-',
          checkIn: x.checkIn ?? '-',
          checkOut: x.checkOut ?? '-',
          price: x.price ?? 0,
          usuarioRegistro: x.usuarioRegistro ?? x.usuarioRegistro ?? '-',
          paymentId: x.paymentId ?? null,
        }));

        this.calculateTotal();
      },
      error: (err) => {
        console.error('Error al cargar reporte', err);
      },
    });
  }

  calculateTotal() {
    this.totalIncome = this.rowData.reduce(
      (acc, item) => acc + (item.price || 0),
      0
    );
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.rowData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Diario');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fileName = `Reporte_${this.start}_to_${this.end}.xlsx`;
    saveAs(blob, fileName);
  }

  // 🔹 Descargar y abrir comprobante en nueva pestaña
  onDownloadReceipt(paymentId: number) {
    if (!paymentId) return;

    // Abrimos la pestaña antes para evitar bloqueo de popups
    const newWindow = window.open('', '_blank');

    this.reservationInfra.downloadPaymentReceipt(paymentId).subscribe({
      next: (blob: Blob) => {
        console.log('Blob PDF recibido:', blob);

        const url = URL.createObjectURL(blob);

        if (newWindow) {
          newWindow.location.href = url; // abre el PDF en esa pestaña
        } else {
          window.open(url, '_blank');
        }

        // Limpieza de la URL temporal después de un rato
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err) => {
        console.error('Error al descargar el comprobante PDF', err);

        if (newWindow) {
          newWindow.close();
        }

        Swal.fire({
          icon: 'error',
          title: 'Error al descargar el comprobante',
          text: 'No se pudo abrir el comprobante de pago.',
          confirmButtonColor: '#dc2626',
        });
      },
    });
  }
}
