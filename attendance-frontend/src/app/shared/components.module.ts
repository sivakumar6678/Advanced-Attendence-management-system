import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@NgModule({
  declarations: [HomeComponent, NavbarComponent],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [HomeComponent, NavbarComponent],
})
export class ComponentsModule {}
