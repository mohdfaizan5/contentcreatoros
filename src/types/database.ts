// Database types for Content OS

// ============================================
// ENUMS
// ============================================
export type IdeaType = 'standalone' | 'series_concept';
export type IdeaStatus = 'dumped' | 'refined' | 'planned' | 'scripted';
export type PlatformType = 'x' | 'youtube' | 'linkedin' | 'generic';
export type InspirationType = 'creator' | 'content';
export type CollectFields = 'email_only' | 'name_and_email';
export type DeliveryType = 'download' | 'redirect' | 'content';

// ============================================
// DATABASE ENTITIES
// ============================================

export interface Idea {
    id: string;
    user_id: string;
    title: string;
    raw_text: string | null;
    idea_type: IdeaType;
    status: IdeaStatus;
    linked_series_id: string | null;
    linked_template_id: string | null;
    target_platform: string | null;
    created_at: string;
    updated_at: string;
}

export interface Template {
    id: string;
    user_id: string;
    name: string;
    platform_type: PlatformType;
    hook_style: string | null;
    length: string | null;
    tone: string | null;
    cta_style: string | null;
    instructions: string | null;
    structure_fields: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Series {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    target_platform: string | null;
    total_planned_items: number;
    origin_idea_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Inspiration {
    id: string;
    user_id: string;
    url: string;
    type: InspirationType;
    title: string | null;
    notes: string | null;
    what_worked: string | null;
    created_at: string;
    updated_at: string;
}

export interface LinkProfile {
    id: string;
    user_id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Link {
    id: string;
    profile_id: string;
    title: string;
    url: string;
    icon: string | null;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LeadMagnet {
    id: string;
    user_id: string;
    slug: string;
    title: string;
    description: string | null;
    collect_fields: CollectFields;
    delivery_type: DeliveryType;
    delivery_url: string | null;
    delivery_content: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Lead {
    id: string;
    magnet_id: string;
    email: string;
    name: string | null;
    created_at: string;
}

// ============================================
// INSERT/UPDATE TYPES (without auto-generated fields)
// ============================================

export interface CreateIdeaInput {
    title: string;
    raw_text?: string | null;
    idea_type?: IdeaType;
    status?: IdeaStatus;
    linked_series_id?: string | null;
    linked_template_id?: string | null;
    target_platform?: string | null;
}

export interface UpdateIdeaInput {
    title?: string;
    raw_text?: string | null;
    idea_type?: IdeaType;
    status?: IdeaStatus;
    linked_series_id?: string | null;
    linked_template_id?: string | null;
    target_platform?: string | null;
}

export interface CreateTemplateInput {
    name: string;
    platform_type: PlatformType;
    hook_style?: string | null;
    length?: string | null;
    tone?: string | null;
    cta_style?: string | null;
    instructions?: string | null;
    structure_fields?: Record<string, unknown>;
}

export interface UpdateTemplateInput {
    name?: string;
    platform_type?: PlatformType;
    hook_style?: string | null;
    length?: string | null;
    tone?: string | null;
    cta_style?: string | null;
    instructions?: string | null;
    structure_fields?: Record<string, unknown>;
}

export interface CreateSeriesInput {
    name: string;
    description?: string | null;
    target_platform?: string | null;
    total_planned_items?: number;
    origin_idea_id?: string | null;
}

export interface UpdateSeriesInput {
    name?: string;
    description?: string | null;
    target_platform?: string | null;
    total_planned_items?: number;
    origin_idea_id?: string | null;
}

export interface CreateInspirationInput {
    url: string;
    type?: InspirationType;
    title?: string | null;
    notes?: string | null;
    what_worked?: string | null;
}

export interface UpdateInspirationInput {
    url?: string;
    type?: InspirationType;
    title?: string | null;
    notes?: string | null;
    what_worked?: string | null;
}

export interface CreateLinkProfileInput {
    username: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
}

export interface UpdateLinkProfileInput {
    username?: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
}

export interface CreateLinkInput {
    profile_id: string;
    title: string;
    url: string;
    icon?: string | null;
    order?: number;
    is_active?: boolean;
}

export interface UpdateLinkInput {
    title?: string;
    url?: string;
    icon?: string | null;
    order?: number;
    is_active?: boolean;
}

export interface CreateLeadMagnetInput {
    slug: string;
    title: string;
    description?: string | null;
    collect_fields?: CollectFields;
    delivery_type?: DeliveryType;
    delivery_url?: string | null;
    delivery_content?: string | null;
    is_active?: boolean;
}

export interface UpdateLeadMagnetInput {
    slug?: string;
    title?: string;
    description?: string | null;
    collect_fields?: CollectFields;
    delivery_type?: DeliveryType;
    delivery_url?: string | null;
    delivery_content?: string | null;
    is_active?: boolean;
}

export interface CreateLeadInput {
    magnet_id: string;
    email: string;
    name?: string | null;
}

// ============================================
// EXTENDED TYPES (with relations)
// ============================================

export interface IdeaWithSeries extends Idea {
    series?: Series | null;
    template?: Template | null;
}

export interface SeriesWithIdeas extends Series {
    ideas?: Idea[];
    origin_idea?: Idea | null;
}

export interface LinkProfileWithLinks extends LinkProfile {
    links?: Link[];
}

export interface LeadMagnetWithLeads extends LeadMagnet {
    leads?: Lead[];
    lead_count?: number;
}
