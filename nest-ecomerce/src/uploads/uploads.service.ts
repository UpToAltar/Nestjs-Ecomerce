import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { S3 } from 'aws-sdk';
import { IUser } from 'src/auth/user.interface';
import { get } from 'http';
@Injectable()
export class UploadsService {
    constructor(private configService : ConfigService){}
    async uploadSingleFile(dataBuffer: Buffer, fileName: string, folder:string, id:string) {
        try {
            const s3 = new S3();
            const uploadResult = await s3.upload({
                Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
                Body: dataBuffer,
                Key: `${folder}/${id}/${uuid()}-${fileName}`,
                ContentType: 'image/png | image/jpg | image/jpeg',
                ACL: 'public-read',
            }).promise();

            const fileStorageInDB = ({
                fileName: fileName,
                fileUrl: uploadResult.Location,
                key: uploadResult.Key,
            });

            
            return fileStorageInDB;
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async deleteSingleFile(fileName: string) {
        try {
            const s3 = new S3();
            
            const key = this.getKey(fileName, 'amazonaws.com/');
            await s3.deleteObject({
                Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
                Key: key,
            }).promise();
            return {
                message: 'Delete file successfully',
                oldPath: fileName,
            }
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async deleteMultipleFile(fileNames: string[]) {
        try {
            const s3 = new S3();
            const keys = [];
            for(let i = 0; i < fileNames.length; i++){
                const key = this.getKey(fileNames[i], 'amazonaws.com/');
                keys.push({Key: key});
            }
            await s3.deleteObjects({
                Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
                Delete: {
                    Objects: keys,
                }
            }).promise();
            return {
                message: 'Delete file successfully',
            }
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    getKey(inputString:string, substring :string) {
        const index = inputString.indexOf(substring);
        if (index !== -1) {
            return inputString.slice(index + substring.length);
        }
        return "";
    }
}
