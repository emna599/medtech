-- Signal global sans données de résident. Les lecteurs voient uniquement les transactions validées.
CREATE TABLE IF NOT EXISTS tour_revision (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    revision bigint NOT NULL DEFAULT 0
);
INSERT INTO tour_revision (singleton) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION bump_tour_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Une seule mise à jour par transaction, au passage des contraintes différées.
    IF current_setting('medtech.tour_revision_recorded', true) IS DISTINCT FROM '1' THEN
        UPDATE tour_revision SET revision = revision + 1 WHERE singleton;
        PERFORM set_config('medtech.tour_revision_recorded', '1', true);
    END IF;
    RETURN NULL;
END;
$$;

DO $$
DECLARE
    relation text;
BEGIN
    FOREACH relation IN ARRAY ARRAY[
        'meal', 'meal_distribution', 'medication_dose', 'resident', 'room',
        'allergy', 'dietary_regime', 'identity_doubt', 'meal_instruction_change'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tour_revision_trigger ON %I', relation);
        EXECUTE format(
            'CREATE CONSTRAINT TRIGGER tour_revision_trigger AFTER INSERT OR UPDATE OR DELETE ON %I
             DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION bump_tour_revision()', relation
        );
    END LOOP;
END;
$$;
