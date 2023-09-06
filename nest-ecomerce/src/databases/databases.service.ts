import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { ProductCategorysService } from 'src/product-categorys/product-categorys.service';
import { ProductCategory, ProductCategoryDocument } from 'src/product-categorys/schemas/product-category.schema';
import {data} from './data/cate_brand';
import { dataProduct } from './data/products';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import slugify from 'slugify';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { BlogCategory, BlogCategoryDocument } from 'src/blog-categorys/schemas/blog-category.schema';
import { roles } from './data/roles';
import { blogCategorys } from './data/blogCategory';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
@Injectable()
export class DatabasesService implements OnModuleInit {
    constructor(
        @InjectModel(ProductCategory.name) private productCategoryModel: SoftDeleteModel<ProductCategoryDocument>,
        @InjectModel(Product.name) private productModel: SoftDeleteModel<ProductDocument>,
        @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
        @InjectModel(BlogCategory.name) private blogCategoryModel: SoftDeleteModel<BlogCategoryDocument>,
        @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
        private usersService: UsersService,
    ) {}

    async createCategory(category:any) {
        let data = [];
        for(let i = 0; i < category.length; i++) {
            let item = {
                name: category[i].cate,
                brand: category[i].brand,
                description:`This is ${category[i].cate} category`
            }
            data.push(item);
        }
        return data;
    }

    convertStringToDecimal(string: string) {
        let number = string.replaceAll(".", "").replace(",", ".");
        return parseFloat(number);
    }

    generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async createProduct(product:any) {
        let data = [];
        for(let i =0 ; i < product.length; i++) {
            let category = await this.productCategoryModel.findOne({name: product[i].category[1]});
            let variants = product[i].variants.find(item => item.label == 'Color');
            let item = {
                title: product[i].name,
                slug:slugify(product[i].name),
                category: category._id,
                description: product[i].description,
                price: this.convertStringToDecimal(product[i].price.slice(0, product[i].price.length - 4)) || 0,
                brand : product[i].brand,
                quantity: this.generateRandomNumber(50, 200),
                sold: this.generateRandomNumber(20, 100),
                images: product[i].images,
                colors: variants?.variants || ["Default"],
                informations: product[i]?.infomations,
            }
            data.push(item);
        }
        return data
    }

    async onModuleInit() {
        // Insert category
        const checkCategory = await this.productCategoryModel.count({});
        if(checkCategory == 0) {
            await this.productCategoryModel.insertMany(await this.createCategory(data));
        }

        // Insert product
        const checkProduct = await this.productModel.count({});
        if(checkProduct == 0) {
            await this.productModel.insertMany(await this.createProduct(dataProduct))
        }

        // Insert role
        const checkRole = await this.roleModel.count({});
        if(checkRole == 0) {
            await this.roleModel.insertMany(roles)
        }

        // Insert blog category
        const checkBlogCategory = await this.blogCategoryModel.count({});
        if(checkBlogCategory == 0) {
            await this.blogCategoryModel.insertMany(blogCategorys)
        }

        // Insert user
        const checkUser = await this.userModel.count({});
        const roleAdmin = await this.roleModel.findOne({name: "ADMIN"});
        const roleUser = await this.roleModel.findOne({name: "USER"});
        const roleModerator = await this.roleModel.findOne({name: "MODERATOR"});
        if(checkUser == 0) {
            await this.userModel.insertMany([
                {
                    email: "admin@gmail.com",
                    name: "Admin",
                    password : this.usersService.hashPassword("123456"),
                    role: roleAdmin._id,
                    address: "Ha Noi",
                    age: 20,
                    phone: "0123456789",
                    gender:"male"
                },
                {
                    email: "user@gmail.com",
                    name: "User",
                    password : this.usersService.hashPassword("123456"),
                    role: roleUser._id,
                    address: "HCM",
                    age: 18,
                    phone: "0123456789",
                    gender:"female"
                },
                {
                    email: "moderator@gmail.com",
                    name: "Moderator",
                    password : this.usersService.hashPassword("123456"),
                    role: roleModerator._id,
                    address: "Da Nang",
                    age: 56,
                    phone: "0123456789",
                    gender:"male"
                }
            ])
        }
    }
}
