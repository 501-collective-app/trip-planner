-- Lets each contact opt out of showing a WhatsApp button (airline support
-- lines, offices, etc. usually don't have WhatsApp even though they have a phone).
alter table contacts add column if not exists has_whatsapp boolean not null default true;
