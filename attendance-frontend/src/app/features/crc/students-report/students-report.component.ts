import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { ChartData, ChartOptions } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-students-report',
  templateUrl: './students-report.component.html',
  styleUrls: ['./students-report.component.css']
})
export class StudentsReportComponent implements OnInit {
  students: { attendance: { subject: string; total: number }[] }[] = [];
  subjects: string[] = [];
  loading = false;

  crcProfile: any;
  fromDate = '2025-04-01';
  toDate = '2025-04-06';

  searchTerm = '';
  selectedPercentage: any = null;
  attendanceData: any;

  showDialog = false;
  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions = {};

  

  percentageFilters = [
    { label: 'All', value: null },
    { label: '< 75%', value: 75 },
    { label: '< 65%', value: 65 },
    { label: '< 50%', value: 50 },
    { label: '< 40%', value: 40 },
    { label: '< 30%', value: 30 },
    { label: '< 20%', value: 20 },
    { label: '< 10%', value: 10 },
    { label: '< 5%', value: 5 }
  ];
  
  
  filteredStudents: any[] = [];

  isVisualized = false;

  toggleVisualization() {
    this.isVisualized = !this.isVisualized;
  }
  
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.crcProfile = this.userService.getCRCDetails();
    this.fetchAttendanceReport();
  }

  fetchAttendanceReport(fromDate?: string, toDate?: string): void {
    if (!this.crcProfile) return;

    this.loading = true;
    const { branch_id, year, semester, academic_year } = this.crcProfile;

    this.userService.getClassAttendanceReport(
      branch_id, year, semester, academic_year,
      this.fromDate, this.toDate
    ).subscribe({
      next: (data) => {
        this.students = data.students || [];
        this.subjects = data.subjects || [];
        this.loading = false;
        this.attendanceData = data;
        this.applyFilters();
        console.log('Attendance data:', data);
        console.log('Students:', this.students);
        console.log('Subjects:', this.subjects);
      },
      error: (err) => {
        console.error('Failed to fetch attendance:', err);
        this.loading = false;
      }
      
    });
    
  }
  getTotalClassesForSubject(subjectName: string): number {
    if (this.students.length) {
      const firstStudent = this.students[0];
      const subject = firstStudent.attendance.find(a => a.subject === subjectName);
      return subject ? subject.total : 0;
    }
    return 0;
  }
  
  getSubjectAttendance(attendanceArray: any[], subjectName: string) {
    return attendanceArray.find(a => a.subject === subjectName) || { present: '-', percentage: '-' };
  }
  
  getOverallTotalClasses(): number {
    let total = 0;
    if (this.students.length) {
      for (const subject of this.subjects) {
        const subjectAttendance = this.students[0].attendance.find(a => a.subject === subject);
        total += subjectAttendance ? subjectAttendance.total : 0;
      }
    }
    return total;
  }
  
  filterByDateRange(): void {
    if (!this.fromDate || !this.toDate) {
      alert("Please select both start and end dates.");
      return;
    }
  
    // Convert to yyyy-mm-dd if needed
    const from = this.formatDate(new Date(this.fromDate));
    const to = this.formatDate(new Date(this.toDate));
  
    this.loading = true;
  
    const { branch_id, year, semester, academic_year } = this.crcProfile;
  
    this.userService.getClassAttendanceReport(
      branch_id, year, semester, academic_year, from, to
    ).subscribe({
      next: (data) => {
        this.students = data.students || [];
        this.subjects = data.subjects || [];
        this.attendanceData = data;
        this.loading = false;
        this.applyFilters(); // re-apply filters after update
      },
      error: (err) => {
        console.error('Error fetching filtered data:', err);
        this.loading = false;
      }
    });
  }
  formatDate(date: Date): string {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
    


  applyFilters(): void {
    let filtered: { name: string; student_id: string; overall_percentage: number }[] = this.attendanceData?.students || [];
  
    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((student: { name: string; student_id: string; overall_percentage: number }) =>
        student.name.toLowerCase().includes(term) ||
        student.student_id.toLowerCase().includes(term)
      );
    }
  
    // Percentage filter
    if (this.selectedPercentage !== null) {
      filtered = filtered.filter(student => student.overall_percentage < this.selectedPercentage);
    }
  
    this.filteredStudents = filtered;
  }
  
  showVisualization(student: any): void {
    const labels: string[] = [];
    const data: number[] = [];

    for (const subject of this.subjects) {
      const att = this.getSubjectAttendance(student.attendance, subject);
      labels.push(subject);
      data.push(att.percentage || 0);
    }

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Attendance %',
          data: data,
          backgroundColor: data.map(val =>
            val < 40 ? '#f44336' : val < 75 ? '#ff9800' : '#4caf50'
          )
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    };

    this.showDialog = true;
  }

  getVisualizationSummary() {
    const summary = {
      high: 0,      // >= 90%
      good: 0,      // 75% to 89%
      warning: 0,   // 60% to 74%
      danger: 0     // < 60%
    };
  
    for (const student of this.filteredStudents) {
      const perc = student.overall_percentage;
      if (perc >= 90) summary.high++;
      else if (perc >= 75) summary.good++;
      else if (perc >= 60) summary.warning++;
      else summary.danger++;
    }
  
    return summary;
  }
 

  
  generatePDF() {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // 1. Title
    doc.setFontSize(16);
    doc.text('Attendance Summary Report', 14, 20);

    // 2. Metadata (left-right layout)
    doc.setFontSize(10);
    doc.text(`Branch: ${this.crcProfile.branch} Year: ${this.crcProfile.year} Semester: ${this.crcProfile.semester}`, 14 , 30);

    doc.text(`From: ${this.fromDate} To: ${this.toDate}`, 220, 30);

    // 3. Optional separator line
    doc.setDrawColor(180);
    doc.line(14, 46, 280, 46); // full-width line

   
  
    // Table columns
    const columns: any[] = [
      { header: 'S.No', dataKey: 'sno' },
      { header: 'Roll No', dataKey: 'roll' },
      { header: 'Name', dataKey: 'name' },
      ...this.subjects.map(subject => ({ header: subject, dataKey: subject })),
      { header: 'Total Classes', dataKey: 'total' },
      { header: 'Attended', dataKey: 'attended' },
      { header: 'Overall %', dataKey: 'overall' }
    ];
  
    // Table rows
    const rows = this.filteredStudents.map((student, index) => {
      const row: any = {
        sno: index + 1,
        roll: student.student_id,
        name: student.name,
        total: this.getOverallTotalClasses(),
        attended: student.total_present,
        overall: `${student.overall_percentage}%`
      };
  
      // Add subject-wise attendance
      for (const subject of this.subjects) {
        const att = this.getSubjectAttendance(student.attendance, subject);
        row[subject] = `${att.present} (${att.percentage}%)`;
      }
  
      return row;
    });
  
    // Draw table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      startY: 35,
      styles: {
        fontSize: 9,
        valign: 'middle',
        halign: 'center'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      didParseCell: (data) => {
        const colIndex = data.column.index;
        const rowIndex = data.row.index;
  
        const columnKey = columns[colIndex].dataKey;
        const student = this.filteredStudents[rowIndex];
  
        if (columnKey === 'overall') {
          const percent = student.overall_percentage;
          if (percent < 65) {
            data.cell.styles.fillColor = [255, 102, 102]; // Red
          } else if (percent < 75) {
            data.cell.styles.fillColor = [255, 204, 102]; // Orange
          }
        }
      }
    });
  
    doc.save('attendance_summary_report.pdf');
  }
  
  exportToExcel(): void {
    const worksheetData = this.filteredStudents.map((student: any, index: number) => {
      const row: any = {
        'S.No': index + 1,
        'Roll No': student.student_id,
        'Name': student.name,
      };
  
      // Add each subject's present count and % to row
      this.subjects.forEach(subject => {
        const att = this.getSubjectAttendance(student.attendance, subject);
        row[`${subject} Present`] = att.present;
        row[`${subject} %`] = att.percentage + '%';
      });
  
      row['Total Classes'] = this.getOverallTotalClasses();
      row['Attended'] = student.total_present;
      row['Overall %'] = student.overall_percentage + '%';
  
      return row;
    });
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'Attendance_Report');
  }
  
  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + '.xlsx');
  }
  

}

