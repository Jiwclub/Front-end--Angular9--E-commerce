import { Component, OnInit } from "@angular/core";
import { ProductService } from "src/app/services/product.service";
import { Router } from '@angular/router';
import { ServerResponse, ProductModelServer } from 'src/app/models/product.model';
import { CartService } from 'src/app/services/cart.service';


@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {

  //ProductModelServer ตัวแปรมาจากไฟล์ใน models
  products: ProductModelServer[] = [];
  constructor(private productService: ProductService,
    private cartService: CartService,
    private router: Router) { }

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((prods: ServerResponse) => {  //ServerResponse เรียกใช้จากไฟล์ models
      this.products = prods.products;
      console.log(this.products)
    })
  }

  selectProduct(id: Number) {
    this.router.navigate(['/product', id]).then();
  }

  AddProduct(id: number) {
    this.cartService.AddProductTocart(id);
  }
}
