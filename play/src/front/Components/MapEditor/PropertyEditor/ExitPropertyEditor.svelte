<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { ExitPropertyData, WAMFileFormat } from "@workadventure/map-editor";
    import { wamFileMigration } from "@workadventure/map-editor/src/Migrations/WamFileMigration";
    import axios from "axios";
    import { LL } from "../../../../i18n/i18n-svelte";
    import { gameManager } from "../../../Phaser/Game/GameManager";
    import Select from "../../Input/Select.svelte";
    import Input from "../../Input/Input.svelte";
    import PropertyEditorBase from "./PropertyEditorBase.svelte";

    export let property: ExitPropertyData;

    const dispatch = createEventDispatcher<{
        change: undefined;
        close: undefined;
    }>();
    // Key: room URL
    let mapsUrl = new Map<
        string,
        {
            name: string;
            wamUrl: string | undefined;
        }
    >();
    let startAreas: string[] = [];
    let useCustomUrl = false;
    let customUrl = property.url || "";

    function onValueChange() {
        dispatch("change");
    }

    function onCustomUrlChange() {
        if (useCustomUrl) {
            property.url = customUrl;
            onValueChange();
        }
    }

    const connection = gameManager.getCurrentGameScene().connection;

    async function fetchMaps(): Promise<void> {
        const response = await gameManager.getCurrentGameScene().connection?.queryRoomsFromSameWorld();

        if (response) {
            for (const room of response) {
                //const url = new URL(room.url);
                mapsUrl.set(room.roomUrl, {
                    name: room.name,
                    wamUrl: room.wamUrl,
                });
            }
            mapsUrl = mapsUrl;
        }
    }

    async function fetchStartAreasName(): Promise<void> {
        if (connection && property.url) {
            const wamUrl = mapsUrl.get(property.url)?.wamUrl;

            if (!wamUrl) {
                return;
            }

            const response = await axios.get(wamUrl);
            const result = WAMFileFormat.safeParse(wamFileMigration.migrate(response.data));
            if (result.success && result.data && result.data.areas) {
                startAreas = result.data.areas
                    .filter((area) => area.properties.find((property) => property.type === "start"))
                    .map((area) => area.name);
            }
        }
    }

    onMount(() => {
        fetchMaps()
            .then(() => {
                return fetchStartAreasName();
            })
            .catch((e) => console.error(e));
    });
</script>

<PropertyEditorBase
    on:close={() => {
        dispatch("close");
    }}
>
    <span slot="header" class="flex justify-center items-center">
        <img
            draggable="false"
            class="w-6 me-2"
            src="resources/icons/icon_exit.png"
            alt={$LL.mapEditor.properties.exitProperties.description()}
        />
        {$LL.mapEditor.properties.exitProperties.label()}
    </span>
    <span slot="content">
        <div class="mb-3">
            <label class="flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    bind:checked={useCustomUrl}
                    on:change={() => {
                        if (!useCustomUrl) {
                            customUrl = property.url || "";
                        }
                    }}
                    class="mr-2"
                />
                <span>Usar URL personalizada</span>
            </label>
        </div>

        {#if useCustomUrl}
            <div class="mb-3">
                <Input
                    id="customExitUrl"
                    label="URL de Saída"
                    type="text"
                    placeholder="/~/filial2.wam ou ~/nomearquivo.wam"
                    bind:value={customUrl}
                    onChange={onCustomUrlChange}
                />
                <p class="text-xs text-gray-400 mt-1">
                    Exemplos: /~/filial2.wam, ~/mapa.wam, http://play.workadventure.localhost/~/mapa.wam
                </p>
            </div>
        {:else}
            <div>
                <Select
                    id="exitMapSelector"
                    label={$LL.mapEditor.properties.exitProperties.exitMap()}
                    bind:value={property.url}
                    onChange={() => {
                        onValueChange();
                        fetchStartAreasName().catch((e) => console.error(e));
                    }}
                >
                    {#each [...mapsUrl.entries()] as map (map[0])}
                        <option value={map[0]}>{map[1].name}</option>
                    {/each}
                </Select>
            </div>
        {/if}

        {#if property.url && !useCustomUrl}
            <div>
                <Select
                    id="startAreaNameSelector"
                    label={$LL.mapEditor.properties.exitProperties.defaultStartArea()}
                    bind:value={property.areaName}
                    onChange={onValueChange}
                    on:blur={onValueChange}
                >
                    <option value="" selected={!property.areaName}
                        >{$LL.mapEditor.properties.exitProperties.defaultStartArea()}</option
                    >
                    {#each startAreas as areaName (areaName)}
                        <option value={areaName} selected={areaName === property.areaName}>{areaName}</option>
                    {/each}
                </Select>
            </div>
        {/if}
    </span>
</PropertyEditorBase>
