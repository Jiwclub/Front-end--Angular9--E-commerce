import { Component, OnInit } from '@angular/core';
import { CartService } from 'src/app/services/cart.service';
import { OrderService } from 'src/app/services/order.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { CartModelServer } from 'src/app/models/cart';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  cartTotal: number;
  cartData: CartModelServer;

  constructor(public cartService: CartService,
    public orderService: OrderService,
    private router: Router,
    private spinner: NgxSpinnerService

  ) { }

  ngOnInit(): void {
    this.cartService.cartData$.subscribe(data => this.cartData = data)
    this.cartService.cartTotal$.subscribe(total => this.cartTotal = total)
  }

  onCheckout(){
    this.spinner.show().then(p => {
      this.cartService.CheckoutFromCart(1);
    })
  }
  

}
