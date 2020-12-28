import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-websocket',
  templateUrl: './websocket.component.html',
  styleUrls: ['./websocket.component.scss']
})
export class WebsocketComponent implements OnInit {

  @ViewChild('Data') data: ElementRef<HTMLElement>;
  responseData = [];

  form: FormGroup;
  subscriptionForm: FormGroup;
  simpleMessageForm: FormGroup;
  filterForm: FormGroup;

  constructor(private formBuilder: FormBuilder, public http: HttpClient, public socketService: SocketService) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      ip: ['http://192.168.100.110:8080/api/socket', Validators.required],
      token: ['eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI0IiwiYXV0aG9yaXRpZXMiOlsiQWRtaW5pc3RyYWRvciJdLCJpYXQiOjE2MDg2NTYxNjN9.8foRFAU3x65Erai7XjArIWgimuefBHyhB0mQ4TZsFVVfw8z_-vK21Z-yHPI1hEWjxviaOn4BaG7720HMsnyduw']
    });








    this.subscriptionForm = this.formBuilder.group({
      path: ['/group/James', Validators.required]
    })
    this.simpleMessageForm = this.formBuilder.group({
      path: ['/group', Validators.required],
      message: ['', Validators.required]
    })
    this.filterForm = this.formBuilder.group({
      property: [''],
      value: [''],
    })

  }

  clearHtml() {
    this.data.nativeElement.innerHTML = '';
  }

  connect() {
    const token = this.form.value.token === '' ? undefined : this.form.value.token;
    this.socketService.connect(this.form.value.ip, token)
  }

  subsciptions = {};

  subscribe() {
    this.responseData = [];
    this.subsciptions[this.subscriptionForm.value.path] = 
                     this.socketService
                     .subscribe(this.subscriptionForm.value.path, 
                      (path: any, incomingData: any) => this.incomingData(path, incomingData, this))
    console.log(this.subsciptions[this.subscriptionForm.value.path])
  }

  unSubscribe() {
    this.subsciptions[this.subscriptionForm.value.path].unsubscribe();
    this.socketService.unSubscribe(this.subscriptionForm.value.path);
  }

  incomingData(path: any, incomingData: any, arg2: this) {
    console.log(path.attachment);
    const filter = arg2.filterForm.value;
    if (filter.property !== '' && filter.value !== '') {
      if (path[filter.property] === filter.value) {
        arg2.appendData(path);
      }
    } else {
      arg2.appendData(path);
    }
  }
  lineNum = 0;
  appendData(path: any) {
    let lines = JSON.stringify(path) + this.data.nativeElement.innerHTML;
    lines = lines.substring(0, 15000);
    this.data.nativeElement.innerHTML = lines;
  }

  sendMessage() {
    this.http.get('/assets/base64.pdf', { responseType: 'text'}).subscribe((file: string) => {
      const message = {"usuario": "JamesA",
      "destinatario": "Liz,James",
      "asunto": null,
      "mensaje": "Wenas",
      "fechaEntrega": "18-12-2020",
      "fechaLeido": null,
      "horaEntrega": "13:25:48",
      "horaLeido": null,
      "attachmentName": null,
      "attachment": null,
      "tipoMensaje": null
}
      this.socketService.send(this.simpleMessageForm.value.path, message);
    }, console.log)
  }
}
