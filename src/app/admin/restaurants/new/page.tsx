import { redirect } from "next/navigation";

// 新規追加は取材投稿ウィザードに統一
export default function NewRestaurantRedirect() {
  redirect("/admin/quick-add");
}
