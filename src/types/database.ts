// Database types for Content OS

// ============================================
// ENUMS
// ============================================
// Note: IdeaType and IdeaStatus kept for backwards compatibility with existing data
export type IdeaType = 'standalone' | 'series_concept';
export type IdeaStatus = 'dumped' | 'refined' | 'planned' | 'scripted';
export type PlatformType = 'x' | 'youtube' | 'linkedin' | 'generic';
export type InspirationType = 'creator' | 'content';
export type CollectFields = 'email_only' | 'name_and_email';
export type DeliveryType = 'download' | 'redirect' | 'content';
export type EmbedType = 'x' | 'instagram' | 'linkedin' | 'link';

// ============================================
// EDITOR.JS TYPES
// ============================================

export interface EditorJSBlock {
    id?: string;
    type: string;
    data: Record<string, unknown>;
}

export interface EditorJSData {
    time?: number;
    blocks: EditorJSBlock[];
    version?: string;
}

// ============================================
// V1 PLANNING TYPES
// ============================================

export interface ContentCard {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    idea_id: string | null;
    platforms: string[]; // e.g., ['youtube', 'linkedin', 'twitter']
    content_type: string | null; // e.g., 'short', 'long-form', 'carousel'
    series_id: string | null;
    column_id: string; // Current kanban column name
    checked: boolean; // Completion checkbox state
    order: number; // Order within column
    created_at: string;
    updated_at: string;
}

export interface UserWorkflow {
    id: string;
    user_id: string;
    columns: string[]; // e.g., ['Starting Point', 'Edited', 'Done']
    created_at: string;
    updated_at: string;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface TemplateExample {
    id: string;
    content: string;
    author: string | null;
    platform: PlatformType | null;
    source_url: string | null;
}

export interface TemplateReference {
    id: string;
    url: string;
    title: string | null;
    embed_type: EmbedType;
}

// ============================================
// DATABASE ENTITIES
// ============================================

export interface Idea {
    id: string;
    user_id: string;
    title: string;
    raw_text: string | null;
    content: EditorJSData | null; // Editor.js JSON data
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
    // Enhanced template fields
    template_text: string | null;
    examples: TemplateExample[];
    reference_links: TemplateReference[];
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
    // Branding fields
    logo_url: string | null;
    banner_url: string | null;
    tagline: string | null;
    // Theme fields
    template_id: string | null;
    accent_color: string | null;
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
    content?: EditorJSData | null;
}

export interface UpdateIdeaInput {
    title?: string;
    raw_text?: string | null;
    content?: EditorJSData | null;
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
    template_text?: string | null;
    examples?: TemplateExample[];
    reference_links?: TemplateReference[];
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
    template_text?: string | null;
    examples?: TemplateExample[];
    reference_links?: TemplateReference[];
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
    logo_url?: string | null;
    banner_url?: string | null;
    tagline?: string | null;
    template_id?: string | null;
    accent_color?: string | null;
}

export interface UpdateLinkProfileInput {
    username?: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    tagline?: string | null;
    template_id?: string | null;
    accent_color?: string | null;
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

// Simplified - IdeaWithSeries alias for backwards compatibility
export type IdeaWithSeries = Idea;

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
