import * as go from "gojs";

import { ReactDiagram } from "gojs-react";

import { useState, useCallback, useEffect } from "react";

import { GuidedDraggingTool } from "@/GuidedDraggingTool";

import { DiagramData } from "@/App";

import "./Diagram.css";

interface DiagramProps {
  diagramData: DiagramData;
  onDiagramEvent: (e: go.DiagramEvent) => void;
  onModelChange: (e: go.IncrementalData) => void;
}

export function DiagramWrapper(props: DiagramProps) {
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [theme, setTheme] = useState("dark");

  const updateLinkColor = (link: any) => {
    let color = theme === "dark" ? "white" : "black";

    // if (link.fromNode && link.fromNode.data.isNew) color = "green";
    // if (color === "black" && link.toNode && link.toNode.data.isNew)
    //   color = "green";
    link.path.stroke = color;
  };

  const diagramRef = useCallback(
    (ref: ReactDiagram | null) => {
      if (ref != null) {
        setDiagram(ref.getDiagram());
        if (diagram instanceof go.Diagram) {
          diagram.addDiagramListener("ChangedSelection", props.onDiagramEvent);
        }
      }
    },
    [diagram, props.onDiagramEvent]
  );

  // Cleanup and listener handling for the diagram's selection event
  useEffect(() => {
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener("ChangedSelection", props.onDiagramEvent);
    }

    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener("ChangedSelection", props.onDiagramEvent);
      }
    };
  }, [diagram, props.onDiagramEvent]);

  // Update links' colors when theme changes
  useEffect(() => {
    console.log("DiagramWrapper useEffect for theme changes");
    if (diagram instanceof go.Diagram) {
      diagram.links.each((link) => updateLinkColor(link));
    }
  }, [diagram, theme]); // Rerun when theme changes

  // Watch for changes to the data-theme attribute
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          const newTheme = document.body.getAttribute("data-theme");
          setTheme(newTheme || "light"); // Update the theme state
        }
      });
    });

    // Start observing the body for attribute changes
    observer.observe(document.body, {
      attributes: true,
    });

    // Cleanup the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []); // Run only once when the component mounts

  /**
   * Diagram initialization method, which is passed to the ReactDiagram component.
   * This method is responsible for making the diagram and initializing the model, any templates,
   * and maybe doing other initialization tasks like customizing tools.
   * The model's data should not be set here, as the ReactDiagram component handles that.
   */
  const initDiagram = (): go.Diagram => {
    const $ = go.GraphObject.make;
    // set your license key here before creating the diagram: go.Diagram.licenseKey = "...";
    const diagram = $(go.Diagram, {
      "undoManager.isEnabled": true, // must be set to allow for model change listening
      // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
      "clickCreatingTool.archetypeNodeData": {
        text: "new node",
        color: "lightblue",
      },
      draggingTool: new GuidedDraggingTool(), // defined in GuidedDraggingTool.ts
      "draggingTool.horizontalGuidelineColor": "blue",
      "draggingTool.verticalGuidelineColor": "blue",
      "draggingTool.centerGuidelineColor": "green",
      "draggingTool.guidelineWidth": 1,
      layout: $(go.ForceDirectedLayout),
      model: $(go.GraphLinksModel, {
        linkKeyProperty: "key", // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        // positive keys for nodes
        makeUniqueKeyFunction: (m: go.Model, data: any) => {
          let k = data.key || 1;
          while (m.findNodeDataForKey(k)) k++;
          data.key = k;
          return k;
        },
        // negative keys for links
        makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
          let k = data.key || -1;
          while (m.findLinkDataForKey(k)) k--;
          data.key = k;
          return k;
        },
      }),
    });

    // define a simple Node template
    diagram.nodeTemplate = $(
      go.Node,
      "Auto", // the Shape will go around the TextBlock
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
        go.Point.stringify
      ),
      $(
        go.Shape,
        "RoundedRectangle",
        {
          name: "SHAPE",
          fill: "white",
          strokeWidth: 0,
          // set the port properties:
          portId: "",
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer",
        },
        // Shape.fill is bound to Node.data.color
        new go.Binding("fill", "color")
      ),
      $(
        go.TextBlock,
        { margin: 8, editable: true, font: "400 .875rem Roboto, sans-serif" }, // some room around the text
        new go.Binding("text").makeTwoWay()
      )
    );

    // relinking depends on modelData
    diagram.linkTemplate = $(
      go.Link,
      {
        fromPortChanged: updateLinkColor,
        toPortChanged: updateLinkColor,
      },
      new go.Binding("relinkableFrom", "canRelink", function () {
        // return theme === "dark" ? "white" : "black";
      }).ofModel(),
      new go.Binding("relinkableTo", "canRelink").ofModel(),
      $(go.Shape),
      $(go.Shape, {
        toArrow: "Standard",
        stroke: theme === "dark" ? "white" : "black",
      })
    );

    return diagram;
  };

  return (
    <ReactDiagram
      ref={diagramRef}
      divClassName="diagram-component"
      initDiagram={initDiagram}
      nodeDataArray={props.diagramData.nodeDataArray}
      linkDataArray={props.diagramData.linkDataArray}
      modelData={props.diagramData.modelData}
      onModelChange={props.onModelChange}
      skipsDiagramUpdate={props.diagramData.skipsDiagramUpdate}
    />
  );
}
