import mongoose from "mongoose"

export interface ICart {
    product: mongoose.Types.ObjectId,
    quantity: number
    color: string
}