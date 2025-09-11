import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String,
      required: true, // URL/path to video
    },
    thumbnail: {
      type: String,
      required:true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ref to User model
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    }, 
    duration: {
      type: Number,
      required:true, // in seconds
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema);