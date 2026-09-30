// Hand-written to match supabase/migrations/*.sql — regenerate with
// `npx supabase gen types typescript --linked > src/lib/supabase/types.ts`
// once the project is linked, and replace this file.
//
// NOTE: if you run the regenerate command above, redirect stdout only after
// the Supabase CLI is actually installed and you're logged in / linked —
// otherwise the CLI's interactive "install this package?" prompt gets
// written into this file instead of real output. Run `npx supabase --version`
// first to confirm the CLI resolves, then run the gen-types command.

export type ListingCondition = 'unused' | 'like_new' | 'good' | 'used';
export type ListingStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'expired' | 'inactive';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          district: string | null;
          locality: string | null;
          pincode: string | null;
          show_phone_publicly: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          district?: string | null;
          locality?: string | null;
          pincode?: string | null;
          show_phone_publicly?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          district?: string | null;
          locality?: string | null;
          pincode?: string | null;
          show_phone_publicly?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string;
          title: string;
          description: string | null;
          material_name: string | null;
          brand: string | null;
          quantity: number;
          unit: string;
          price: number;
          original_price: number | null;
          condition: ListingCondition;
          manufacture_date: string | null;
          expiry_date: string | null;
          district: string;
          locality: string;
          pincode: string | null;
          location: unknown | null;
          contact_phone: string | null;
          pickup_available: boolean;
          delivery_available: boolean;
          status: ListingStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          material_name?: string | null;
          brand?: string | null;
          quantity: number;
          unit: string;
          price: number;
          original_price?: number | null;
          condition: ListingCondition;
          manufacture_date?: string | null;
          expiry_date?: string | null;
          district: string;
          locality: string;
          pincode?: string | null;
          location?: unknown | null;
          contact_phone?: string | null;
          pickup_available?: boolean;
          delivery_available?: boolean;
          status?: ListingStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          category_id?: string;
          title?: string;
          description?: string | null;
          material_name?: string | null;
          brand?: string | null;
          quantity?: number;
          unit?: string;
          price?: number;
          original_price?: number | null;
          condition?: ListingCondition;
          manufacture_date?: string | null;
          expiry_date?: string | null;
          district?: string;
          locality?: string;
          pincode?: string | null;
          location?: unknown | null;
          contact_phone?: string | null;
          pickup_available?: boolean;
          delivery_available?: boolean;
          status?: ListingStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'listings_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_images_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorites_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      enquiries: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          message: string;
          contact_method: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          message: string;
          contact_method?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          message?: string;
          contact_method?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'enquiries_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enquiries_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      profiles_public: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          district: string | null;
          locality: string | null;
          created_at: string;
          show_phone_publicly: boolean;
          phone: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      nearby_listings: {
        Args: {
          search_lat: number;
          search_lng: number;
          radius_km?: number | null;
          category_filter?: string | null;
          min_price?: number | null;
          max_price?: number | null;
          page_limit?: number;
          page_offset?: number;
        };
        Returns: {
          id: string;
          title: string;
          price: number;
          condition: ListingCondition;
          district: string;
          locality: string;
          quantity: number;
          unit: string;
          status: ListingStatus;
          created_at: string;
          distance_km: number | null;
          primary_image_path: string | null;
        }[];
      };
    };
  };
}
