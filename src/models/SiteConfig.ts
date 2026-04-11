import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteConfig extends Document {
  blogTitle: string;
  blogDescription: string;
  categories: string[];
  heroImage?: string;
  aboutText: string;
  contactEmail: string;
}

const SiteConfigSchema: Schema = new Schema({
  blogTitle: { type: String, default: 'History Blog' },
  blogDescription: { type: String, default: 'Chuyên trang nghiên cứu lịch sử' },
  categories: { type: [String], default: [] },
  heroImage: { type: String },
  aboutText: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
});

export default mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
