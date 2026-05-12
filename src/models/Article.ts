import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  tags: string[];
  content: string;
  author: string;
  date: string;
  readingTime: number;
  featured: boolean;
  coverImage?: string;
  status: 'draft' | 'published';
  footnotes?: Array<{ id: string; num: number; content: string }>;
  /** Set on successful rasterization. Compared against `updatedAt` to derive "Rasterized" vs "Unrasterized". */
  rasterizedAt?: Date;
}

const ArticleSchema: Schema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  excerpt: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  content: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: String, required: true },
  readingTime: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  coverImage: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  footnotes: [{
    id: { type: String },
    num: { type: Number },
    content: { type: String }
  }],
  pages: [{
    pageNumber: { type: Number },
    imageUrl: { type: String }
  }],
  markdownPages: [{
    pageNumber: { type: Number },
    markdown: { type: String }
  }],
  rasterizedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);
