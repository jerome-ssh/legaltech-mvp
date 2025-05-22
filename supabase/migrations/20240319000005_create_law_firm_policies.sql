-- Create RLS policies for law_firms that reference law_firm_associations
CREATE POLICY "Users can view their own law firms"
    ON law_firms FOR SELECT
    USING (
        id IN (
            SELECT law_firm_id 
            FROM law_firm_associations 
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own law firms"
    ON law_firms FOR ALL
    USING (
        id IN (
            SELECT law_firm_id 
            FROM law_firm_associations 
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
            AND role_id IN (
                SELECT id FROM roles WHERE name IN ('managing_partner', 'partner')
            )
        )
    );

-- Add foreign key constraint to law_firm_associations
ALTER TABLE law_firm_associations
    ADD CONSTRAINT fk_law_firm_associations_law_firm_id
    FOREIGN KEY (law_firm_id)
    REFERENCES law_firms(id)
    ON DELETE CASCADE; 