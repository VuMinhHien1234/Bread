"use client";

import { createAuthClient } from "better-auth/react";

/** Dùng ở trình duyệt cho đăng nhập / đăng xuất; không chứa khóa bí mật. */
export const authClient = createAuthClient();
