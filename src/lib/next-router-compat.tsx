"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, type ReactNode } from "react";

export type MetaDescriptor = {
  title?: string;
  name?: string;
  content?: string;
  property?: string;
  charSet?: string;
  httpEquiv?: string;
};

export type LinkDescriptor = {
  rel?: string;
  href?: string;
  type?: string;
  media?: string;
  sizes?: string;
  crossOrigin?: string;
};

type SearchValue = string | number | boolean | null | undefined;

type NavigateOptions = {
  to: string;
  replace?: boolean;
  search?: Record<string, SearchValue> | string;
};

type RouteConfig<C extends ComponentType<any>, S> = {
  component: C;
  head?: () => { meta?: MetaDescriptor[]; links?: LinkDescriptor[] };
  validateSearch?: (search: Record<string, unknown>) => S;
};

function buildHref(to: string, search?: NavigateOptions["search"]) {
  if (!search) return to;
  if (typeof search === "string") {
    return search.startsWith("?") ? `${to}${search}` : `${to}?${search}`;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const q = query.toString();
  return q ? `${to}?${q}` : to;
}

export function createFileRoute<Path extends string>(path: Path) {
  return function defineRoute<C extends ComponentType<any>, S = Record<string, unknown>>(config: RouteConfig<C, S>) {
    return {
      path,
      options: config,
      ...config,
      useSearch: () => {
        const params = useSearchParams();
        const raw = Object.fromEntries(params.entries());
        return config.validateSearch ? config.validateSearch(raw) : (raw as S);
      },
    };
  };
}

export function useNavigate() {
  const router = useRouter();
  return ({ to, replace = false, search }: NavigateOptions) => {
    const href = buildHref(to, search);
    if (replace) router.replace(href);
    else router.push(href);
  };
}

export function useRouterState<T>({ select }: { select: (state: { location: { pathname: string } }) => T }): T {
  const pathname = usePathname() ?? "/";
  return select({ location: { pathname } });
}

export function useCompatLocation() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  return { pathname, searchParams };
}

export function Link({ to, search, ...props }: {
  to: string;
  search?: Record<string, SearchValue> | string;
  children: ReactNode;
  className?: string;
  replace?: boolean;
  prefetch?: NextLinkProps["prefetch"];
  [key: string]: any;
}) {
  return <NextLink href={buildHref(to, search)} {...props} />;
}

export function Outlet({ children }: { children?: ReactNode } = {}) {
  return children ?? null;
}
