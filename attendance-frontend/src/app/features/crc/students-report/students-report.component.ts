import { Component, OnInit,Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-students-report',
  templateUrl: './students-report.component.html',
  styleUrls: ['./students-report.component.css']
})
export class StudentsReportComponent implements OnInit {
  teacherId: number | null = null;
  branch: string | null = null;
  subjects: any[] = [];
  @Input() selectedSubject: any;  // ✅ Receive selected subject

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    console.log('StudentsReportComponent',this.selectedSubject);
    // this.route.queryParams.subscribe(params => {
    //   this.teacherId = params['teacherId'];
    //   this.branch = params['branch'];
    //   this.subjects = JSON.parse(params['subjects']);
    // });
  }
}
